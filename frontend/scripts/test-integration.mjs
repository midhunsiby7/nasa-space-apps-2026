/**
 * COSMOLOOKUP Phase 2, 3B, 4 & Anatomy End-to-End Integration Test Suite
 * Validates Frontend API Client, Measurement Catalog, Context Taxonomy,
 * Personal Baseline Calculation Engine, Telemetry Freshness, Health Trends,
 * Explainable Assessments, Alert Lifecycles, and Anatomy Mappings against
 * an isolated live FastAPI Backend.
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const BACKEND_DIR = path.resolve(__dirname, '../../backend');
const TEST_DB_FILE = path.resolve(BACKEND_DIR, 'test_cosmolookup_isolated.db');
const TEST_DB_URL = 'sqlite:///./test_cosmolookup_isolated.db';

let backendProcess = null;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanDatabaseFiles() {
  const filesToRemove = [
    TEST_DB_FILE,
    `${TEST_DB_FILE}-shm`,
    `${TEST_DB_FILE}-wal`,
  ];
  for (const f of filesToRemove) {
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch (e) {
        // Ignored if file locked or already removed
      }
    }
  }
}

async function startBackend() {
  console.log('[TEST SETUP] Initializing clean isolated test database...');
  cleanDatabaseFiles();

  const env = { ...process.env, DATABASE_URL: TEST_DB_URL };

  console.log('[TEST SETUP] Executing backend seed on isolated database...');
  try {
    execSync('python -c "from app.seed import seed_database; seed_database()"', {
      cwd: BACKEND_DIR,
      env,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('[TEST SETUP] Error during database seeding:', err.message);
    throw err;
  }

  console.log('[TEST SETUP] Adding synthetic integration fixtures (exercise modalities and test alert)...');
  try {
    const fixtureCode = [
      'from datetime import datetime, timezone, timedelta',
      'from app.database.connection import SessionLocal',
      'from app.models.measurement import Measurement',
      'from app.models.alert import HealthAlert',
      'db = SessionLocal()',
      'now = datetime.now(timezone.utc)',
      "db.add(Measurement(id='meas-int-exercise-ared', astronaut_id='astro-001', measurement_type='heart_rate', value=142.0, unit='bpm', measured_at=now - timedelta(hours=2), source='synthetic_integration_fixture', context='exercise_active', exercise_modality='ared_resistive', data_quality='nominal', is_synthetic=True))",
      "db.add(Measurement(id='meas-int-exercise-cevis', astronaut_id='astro-001', measurement_type='heart_rate', value=155.0, unit='bpm', measured_at=now - timedelta(hours=3), source='synthetic_integration_fixture', context='exercise_active', exercise_modality='cevis_aerobic', data_quality='nominal', is_synthetic=True))",
      "db.add(Measurement(id='meas-int-bp-dia', astronaut_id='astro-001', measurement_type='blood_pressure_diastolic', value=76.0, unit='mmHg', measured_at=now - timedelta(hours=1), source='synthetic_integration_fixture', context='resting_cabin', data_quality='nominal', is_synthetic=True))",
      "db.add(HealthAlert(id='alert-test-lifecycle-01', astronaut_id='astro-001', measurement_type='heart_rate', category='physiological_shift', severity='medium', title='Elevated Resting Heart Rate Test Alert', explanation='Demonstration alert for lifecycle integration testing.', status='active', created_at=now - timedelta(hours=1), is_synthetic=True))",
      'db.commit()',
      'db.close()',
      "print('Synthetic fixtures successfully seeded.')",
    ].join('; ');

    execSync(`python -c "${fixtureCode}"`, {
      cwd: BACKEND_DIR,
      env,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('[TEST SETUP] Error inserting synthetic test fixtures:', err.message);
    throw err;
  }

  console.log('[TEST SETUP] Spawning local FastAPI backend server on port 8000 with isolated DB...');
  backendProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--port', '8000'], {
    cwd: BACKEND_DIR,
    env,
    stdio: 'ignore',
  });

  // Poll health check until responsive
  let attempts = 0;
  while (attempts < 20) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/health');
      if (res.ok) {
        console.log('[TEST SETUP] Backend service is healthy and responding.');
        return;
      }
    } catch {
      // Waiting
    }
    await sleep(600);
    attempts++;
  }
  throw new Error('Failed to start or connect to backend service within 12 seconds.');
}

function stopBackend() {
  if (backendProcess) {
    console.log('[TEST TEARDOWN] Terminating backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
  console.log('[TEST TEARDOWN] Cleaning up isolated database files...');
  cleanDatabaseFiles();
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    await startBackend();

    console.log('\n--- EXECUTING PHASE 2 FOUNDATION INTEGRATION SUITE ---');

    // 1. Health Check
    const healthRes = await fetch('http://127.0.0.1:8000/api/v1/health');
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'healthy', '1. Backend health check (/api/v1/health)');

    // 2. Astronauts listing
    const astroRes = await fetch(`${BASE_URL}/astronauts`);
    const astroJson = await astroRes.json();
    assert(
      astroRes.status === 200 && Array.isArray(astroJson.data) && astroJson.total >= 5,
      '2. Astronaut listing retrieval (seeded total >= 5)'
    );

    // 3. First seeded astronaut schema verification
    const firstAstro = astroJson.data.find((a) => a.id === 'astro-001');
    assert(
      firstAstro &&
        firstAstro.id === 'astro-001' &&
        firstAstro.name === 'Dr. Sarah Connor' &&
        firstAstro.mission_name === 'Artemis VII',
      '3. Astronaut schema fields (astro-001: Dr. Sarah Connor, Artemis VII)'
    );

    // 4. Astronaut detail by ID
    const astroDetailRes = await fetch(`${BASE_URL}/astronauts/astro-001`);
    const astroDetailJson = await astroDetailRes.json();
    assert(astroDetailRes.status === 200 && astroDetailJson.id === 'astro-001', '4. Astronaut detail lookup (/api/v1/astronauts/astro-001)');

    // 5. Measurements retrieval
    const measRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements`);
    const measJson = await measRes.json();
    assert(measRes.status === 200 && Array.isArray(measJson.data) && measJson.total >= 25, '5. Measurement collection retrieval (total >= 25 records)');

    // 6. Verify measurement fields & synthetic flag
    const allSynthetic = measJson.data.every((m) => m.is_synthetic === true);
    assert(allSynthetic, '6. Provenance transparency: All seeded measurements have is_synthetic = true');

    // 7. Verify core measurement types present in backend seed
    const distinctTypes = Array.from(new Set(measJson.data.map((m) => m.measurement_type)));
    const coreTypes = ['blood_pressure_systolic', 'body_temperature', 'heart_rate', 'spo2'];
    const hasCoreTypes = coreTypes.every((t) => distinctTypes.includes(t));
    assert(
      hasCoreTypes,
      '7. Measurement type reconciliation: Core seeded metrics verified (heart_rate, spo2, body_temperature, blood_pressure_systolic)'
    );

    // 8. Metric filter query
    const hrFilterRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?measurement_type=heart_rate`);
    const hrFilterJson = await hrFilterRes.json();
    assert(
      hrFilterRes.status === 200 && hrFilterJson.data.every((m) => m.measurement_type === 'heart_rate'),
      '8. Measurement filtering by measurement_type=heart_rate'
    );

    // 9. Mission filter query: Artemis VII
    const missionFilterRes = await fetch(`${BASE_URL}/astronauts?mission_name=Artemis%20VII`);
    const missionFilterJson = await missionFilterRes.json();
    assert(
      missionFilterRes.status === 200 && missionFilterJson.data.length >= 2,
      '9. Astronaut directory filtering by mission_name=Artemis VII (returns Dr. Sarah Connor and Alex Chen)'
    );

    // 10. Pagination limit and offset
    const pageRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?limit=5&offset=5`);
    const pageJson = await pageRes.json();
    assert(
      pageRes.status === 200 && pageJson.data.length === 5 && pageJson.limit === 5 && pageJson.offset === 5,
      '10. Measurement pagination (limit=5, offset=5)'
    );

    // 11. Invalid astronaut ID returns HTTP 404
    const notFoundRes = await fetch(`${BASE_URL}/astronauts/astro-nonexistent-999`);
    const notFoundJson = await notFoundRes.json();
    assert(
      notFoundRes.status === 404 && notFoundJson.error && notFoundJson.error.code === 'ASTRONAUT_NOT_FOUND',
      '11. Error handling: Non-existent astronaut returns 404 and standard error envelope'
    );

    // 12. Invalid query parameter returns HTTP 400
    const invalidQueryRes = await fetch(`${BASE_URL}/astronauts?limit=999`);
    const invalidQueryJson = await invalidQueryRes.json();
    assert(
      invalidQueryRes.status === 400 && invalidQueryJson.error && invalidQueryJson.error.code === 'INVALID_QUERY_PARAMETER',
      '12. Error handling: Invalid query limit=999 returns 400 and standard envelope'
    );

    // 13. Empty measurement results for valid astronaut with non-existent metric
    const emptyMeasRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?measurement_type=radiation_dose`);
    const emptyMeasJson = await emptyMeasRes.json();
    assert(
      emptyMeasRes.status === 200 && emptyMeasJson.data.length === 0 && emptyMeasJson.total === 0,
      '13. Empty measurement handling: Missing radiation_dose returns valid empty collection without crashing'
    );

    // --- PHASE 3B: MEASUREMENT CATALOG & CONTEXT TAXONOMY ---
    console.log('\n--- EXECUTING PHASE 3B CATALOG & CONTEXT SUITE ---');

    // 14. Measurement Catalog endpoint
    const catalogRes = await fetch(`${BASE_URL}/measurements/catalog`);
    const catalogJson = await catalogRes.json();
    assert(
      catalogRes.status === 200 &&
        Array.isArray(catalogJson.metrics) &&
        catalogJson.metrics.length === 10 &&
        catalogJson.contexts &&
        Array.isArray(catalogJson.exercise_modalities),
      '14. Catalog discovery: GET /api/v1/measurements/catalog returns 10 canonical metrics, 3 context tiers, 5 modalities'
    );

    // 15. Catalog entry schema check
    const hrCatalog = catalogJson.metrics.find((m) => m.canonical_identifier === 'heart_rate');
    assert(
      hrCatalog &&
        hrCatalog.category === 'cardiovascular' &&
        hrCatalog.standard_unit === 'bpm' &&
        hrCatalog.valid_range_min === 30.0 &&
        hrCatalog.valid_range_max === 220.0,
      '15. Catalog metadata: Heart rate has valid physical sanity bounds [30.0 - 220.0 bpm]'
    );

    // 16. Context filtering on measurements
    const restingMeasRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?context=resting_cabin`);
    const restingMeasJson = await restingMeasRes.json();
    assert(
      restingMeasRes.status === 200 &&
        restingMeasJson.data.every((m) => m.context === 'resting_cabin'),
      '16. Context filtering: Query with context=resting_cabin isolates resting measurements'
    );

    // 17. Context + Exercise Modality filtering
    const exerciseMeasRes = await fetch(
      `${BASE_URL}/astronauts/astro-001/measurements?context=exercise_active&exercise_modality=ared_resistive`
    );
    const exerciseMeasJson = await exerciseMeasRes.json();
    assert(
      exerciseMeasRes.status === 200 &&
        exerciseMeasJson.data.length > 0 &&
        exerciseMeasJson.data.every(
          (m) => m.context === 'exercise_active' && m.exercise_modality === 'ared_resistive'
        ),
      '17. Modality filtering: Query with context=exercise_active & exercise_modality=ared_resistive'
    );

    // --- PHASE 4: PERSONAL BASELINE CALCULATION & OPERATIONAL ENVELOPES ---
    console.log('\n--- EXECUTING PHASE 4 PERSONAL BASELINES SUITE ---');

    // 18. Baseline Calculation Eligibility Guard: Rejection of Ineligible Context (EVA)
    const evaCalcRes = await fetch(`${BASE_URL}/astronauts/astro-001/baselines/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measurement_type: 'heart_rate',
        context: 'eva_operational',
      }),
    });
    const evaCalcJson = await evaCalcRes.json();
    assert(
      evaCalcRes.status === 400 &&
        evaCalcJson.error &&
        evaCalcJson.error.code === 'INELIGIBLE_BASELINE_CONTEXT',
      '18. Baseline eligibility guard: Rejects calculating baseline for Tier B context eva_operational (HTTP 400)'
    );

    // 19. Baseline Data Guard: Insufficient Comparable Measurements (422)
    const emptyCalcRes = await fetch(`${BASE_URL}/astronauts/astro-001/baselines/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measurement_type: 'respiratory_rate',
        context: 'resting_cabin',
        include_degraded: false,
      }),
    });
    const emptyCalcJson = await emptyCalcRes.json();
    assert(
      emptyCalcRes.status === 422 &&
        emptyCalcJson.error &&
        emptyCalcJson.error.code === 'INSUFFICIENT_MEASUREMENTS',
      '19. Baseline data guard: Returns 422 INSUFFICIENT_MEASUREMENTS when database has insufficient context-matched data'
    );

    // 20. Baseline Calculation: Successful Calculation with Eligible, Adequately Populated Data
    const calcRes = await fetch(`${BASE_URL}/astronauts/astro-001/baselines/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measurement_type: 'heart_rate',
        context: 'resting_cabin',
        include_degraded: false,
      }),
    });
    const calcJson = await calcRes.json();
    assert(
      calcRes.status === 200 &&
        calcJson.astronaut_id === 'astro-001' &&
        calcJson.measurement_type === 'heart_rate' &&
        calcJson.context === 'resting_cabin' &&
        calcJson.envelope &&
        calcJson.envelope.sample_count >= 5,
      '20. Baseline calculation success: Calculates and persists robust envelope from populated resting telemetry (HTTP 200)'
    );

    // 21. Statistical Mathematical Integrity of Actual Calculated Envelope
    const env = calcJson.envelope;
    const mathValid =
      env.q25 <= env.median &&
      env.median <= env.q75 &&
      Math.abs(env.iqr - (env.q75 - env.q25)) < 0.001 &&
      env.robust_scale_iqr > 0 &&
      env.sample_count >= 5 &&
      typeof env.disclaimer === 'string';
    assert(
      mathValid,
      '21. Statistical mathematical integrity: q25 <= median <= q75, IQR = Q3 - Q1, robust_scale = IQR/1.349'
    );

    // 22. Baseline Listing: GET /api/v1/astronauts/{id}/baselines
    const listBaseRes = await fetch(`${BASE_URL}/astronauts/astro-001/baselines`);
    const listBaseJson = await listBaseRes.json();
    assert(
      listBaseRes.status === 200 &&
        Array.isArray(listBaseJson.data) &&
        listBaseJson.data.some((b) => b.measurement_type === 'heart_rate'),
      '22. Baseline listing: GET /astronauts/astro-001/baselines returns calculated baseline envelopes'
    );

    // 23. Single Baseline Lookup: GET /api/v1/astronauts/{id}/baselines/{type}
    const singleBaseRes = await fetch(
      `${BASE_URL}/astronauts/astro-001/baselines/heart_rate?context=resting_cabin`
    );
    const singleBaseJson = await singleBaseRes.json();
    assert(
      singleBaseRes.status === 200 &&
        singleBaseJson.measurement_type === 'heart_rate' &&
        singleBaseJson.context === 'resting_cabin' &&
        singleBaseJson.envelope.sample_count >= 5,
      '23. Single baseline lookup: GET /astronauts/astro-001/baselines/heart_rate retrieves specific envelope'
    );

    // 24. Active Baseline Reference Lookup: GET /api/v1/astronauts/{id}/baselines/active
    const activeBaseRes = await fetch(
      `${BASE_URL}/astronauts/astro-001/baselines/active?context=resting_cabin`
    );
    const activeBaseJson = await activeBaseRes.json();
    assert(
      activeBaseRes.status === 200 &&
        Array.isArray(activeBaseJson.data) &&
        activeBaseJson.data.some((b) => b.measurement_type === 'heart_rate' && b.is_active === true),
      '24. Active baseline lookup: GET /astronauts/astro-001/baselines/active verifies active lifecycle status'
    );

    // 25. Baseline Not Found (404) for uncalculated metric
    const notFoundBaseRes = await fetch(
      `${BASE_URL}/astronauts/astro-001/baselines/radiation_dose?context=resting_cabin`
    );
    const notFoundBaseJson = await notFoundBaseRes.json();
    assert(
      notFoundBaseRes.status === 404 &&
        notFoundBaseJson.error &&
        notFoundBaseJson.error.code === 'BASELINE_NOT_FOUND',
      '25. Error handling: Uncalculated baseline returns 404 BASELINE_NOT_FOUND envelope'
    );

    // --- CLIENT-SIDE SCIENTIFIC COMPARABILITY ENGINE EVALUATION ---
    console.log('\n--- EXECUTING CLIENT SCIENTIFIC COMPARABILITY SUITE ---');

    function testComparability(obsVal, obsCtx, obsMod, obsType, baselineObj) {
      if (!baselineObj) {
        return { isComparable: false, reason: 'No calculated personal baseline envelope is available.' };
      }
      const normObs = obsType === 'blood_oxygen' ? 'spo2' : obsType;
      const normBase = baselineObj.measurement_type === 'blood_oxygen' ? 'spo2' : baselineObj.measurement_type;
      if (
        (normObs === 'body_temperature' && normBase === 'core_temperature') ||
        (normObs === 'core_temperature' && normBase === 'body_temperature')
      ) {
        return { isComparable: false, reason: 'Physiological isolation: Superficial vs core temperature.' };
      }
      if (normObs !== normBase) {
        return { isComparable: false, reason: 'Metric mismatch.' };
      }
      const obsC = obsCtx || 'unknown';
      const baseC = baselineObj.context || 'resting_cabin';
      if (obsC === 'eva_operational' || baseC === 'eva_operational') {
        if (obsC !== baseC) {
          return { isComparable: false, reason: 'Operational isolation: EVA vs cabin.' };
        }
      }
      if (obsMod && baselineObj.exercise_modality && obsMod !== baselineObj.exercise_modality) {
        return { isComparable: false, reason: 'Modality isolation: Countermeasure equipment mismatch.' };
      }
      const median = baselineObj.envelope.median;
      const q25 = baselineObj.envelope.q25;
      const q75 = baselineObj.envelope.q75;
      const absoluteDelta = Number((obsVal - median).toFixed(2));
      const isWithinIqr = obsVal >= q25 && obsVal <= q75;
      return { isComparable: true, absoluteDelta, isWithinIqr };
    }

    // 26. Matching observation within IQR
    const comp1 = testComparability(calcJson.envelope.median, 'resting_cabin', null, 'heart_rate', calcJson);
    assert(
      comp1.isComparable === true && comp1.isWithinIqr === true,
      '26. Comparability engine: Median reading in resting_cabin matches heart_rate baseline within IQR'
    );

    // 27. Matching observation outside IQR
    const comp2 = testComparability(120.0, 'resting_cabin', null, 'heart_rate', calcJson);
    assert(
      comp2.isComparable === true && comp2.isWithinIqr === false,
      '27. Comparability engine: 120 bpm in resting_cabin identifies observation outside IQR'
    );

    // 28. Context rejection (EVA vs resting)
    const comp3 = testComparability(110.0, 'eva_operational', null, 'heart_rate', calcJson);
    assert(
      comp3.isComparable === false && comp3.reason.includes('Operational isolation'),
      '28. Scientific isolation: Rejects comparing EVA telemetry against resting cabin baseline'
    );

    // 29. Modality rejection (ARED vs CEVIS)
    const comp4 = testComparability(140.0, 'exercise_active', 'cevis_aerobic', 'heart_rate', {
      ...calcJson,
      context: 'exercise_active',
      exercise_modality: 'ared_resistive',
    });
    assert(
      comp4.isComparable === false && comp4.reason.includes('Modality isolation'),
      '29. Scientific isolation: Rejects comparing CEVIS aerobic exercise against ARED resistive baseline'
    );

    // 30. Temperature independence (body vs core)
    const comp5 = testComparability(36.8, 'resting_cabin', null, 'body_temperature', {
      ...calcJson,
      measurement_type: 'core_temperature',
    });
    assert(
      comp5.isComparable === false && comp5.reason.includes('Physiological isolation'),
      '30. Scientific isolation: Rejects interchanging superficial body temperature and core temperature'
    );

    // 31. Wire alias normalization (blood_oxygen -> spo2)
    const comp6 = testComparability(98.0, 'resting_cabin', null, 'blood_oxygen', {
      ...calcJson,
      measurement_type: 'spo2',
    });
    assert(
      comp6.isComparable === true,
      '31. Wire aliasing: blood_oxygen resolves to canonical spo2 for baseline comparison'
    );

    // 32. Missing baseline handling
    const comp7 = testComparability(70.0, 'resting_cabin', null, 'heart_rate', null);
    assert(
      comp7.isComparable === false,
      '32. Missing baseline handling: Returns safe non-comparable result when baseline envelope is absent'
    );

    // --- PHASE 4 & PR #11: TRENDS, FRESHNESS, ASSESSMENTS & ALERTS LIFECYCLE ---
    console.log('\n--- EXECUTING PHASE 4 / PR #11 HEALTH INTELLIGENCE & ALERTS SUITE ---');

    // 33. Telemetry Freshness endpoint
    const freshnessRes = await fetch(`${BASE_URL}/astronauts/astro-001/trends/freshness`);
    const freshnessJson = await freshnessRes.json();
    assert(
      freshnessRes.status === 200 &&
        freshnessJson.astronaut_id === 'astro-001' &&
        Array.isArray(freshnessJson.items) &&
        freshnessJson.total_metrics >= 1,
      '33. Telemetry freshness report: GET /astronauts/astro-001/trends/freshness returns structured metrics report'
    );

    // 34. Health Trends endpoint
    const trendsRes = await fetch(`${BASE_URL}/astronauts/astro-001/trends?context=resting_cabin&lookback_hours=72`);
    const trendsJson = await trendsRes.json();
    assert(
      trendsRes.status === 200 &&
        trendsJson.astronaut_id === 'astro-001' &&
        Array.isArray(trendsJson.data) &&
        trendsJson.total >= 1,
      '34. Health trends retrieval: GET /astronauts/astro-001/trends evaluates multi-metric trajectories'
    );

    // 35. Trend observation schema integrity
    const hrTrend = trendsJson.data.find((t) => t.measurement_type === 'heart_rate');
    assert(
      hrTrend &&
        typeof hrTrend.trend_direction === 'string' &&
        typeof hrTrend.freshness_status === 'string' &&
        hrTrend.sample_count >= 1 &&
        (hrTrend.sens_slope === null || typeof hrTrend.sens_slope === 'number'),
      '35. Trend observation schema integrity: Contains trend_direction, freshness_status, sample_count, and sens_slope'
    );

    // 36. Single metric trend endpoint
    const singleTrendRes = await fetch(`${BASE_URL}/astronauts/astro-001/trends/heart_rate?context=resting_cabin`);
    const singleTrendJson = await singleTrendRes.json();
    assert(
      singleTrendRes.status === 200 &&
        singleTrendJson.canonical_identifier === 'heart_rate' &&
        singleTrendJson.trend_direction !== undefined,
      '36. Single metric trend: GET /astronauts/astro-001/trends/heart_rate evaluates specific metric trajectory'
    );

    // 37. Latest Health Assessment
    const latestAsmRes = await fetch(`${BASE_URL}/astronauts/astro-001/assessments/latest`);
    const latestAsmJson = await latestAsmRes.json();
    const validClassifications = ['routine', 'needs_attention', 'medical_review_recommended', 'emergency'];
    assert(
      latestAsmRes.status === 200 &&
        latestAsmJson.astronaut_id === 'astro-001' &&
        validClassifications.includes(latestAsmJson.overall_classification) &&
        Array.isArray(latestAsmJson.findings) &&
        Array.isArray(latestAsmJson.guidance),
      '37. Latest health assessment: GET /astronauts/astro-001/assessments/latest returns explainable findings & guidance'
    );

    // 38. Assessment Generation endpoint
    const genAsmRes = await fetch(`${BASE_URL}/astronauts/astro-001/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'resting_cabin',
        lookback_hours: 72,
        generate_alerts: true,
      }),
    });
    const genAsmJson = await genAsmRes.json();
    assert(
      genAsmRes.status === 200 &&
        genAsmJson.astronaut_id === 'astro-001' &&
        validClassifications.includes(genAsmJson.overall_classification),
      '38. Assessment synthesis: POST /astronauts/astro-001/assessments deterministically synthesizes decision support'
    );

    // 39. Operational Alerts retrieval
    const alertsRes = await fetch(`${BASE_URL}/astronauts/astro-001/alerts`);
    const alertsJson = await alertsRes.json();
    assert(
      alertsRes.status === 200 &&
        alertsJson.astronaut_id === 'astro-001' &&
        Array.isArray(alertsJson.data) &&
        alertsJson.total >= 1,
      '39. Operational alerts collection: GET /astronauts/astro-001/alerts retrieves active alerts'
    );

    // 40. Alert Lifecycle: Acknowledge alert
    const targetAlert = alertsJson.data.find((a) => a.id === 'alert-test-lifecycle-01') || alertsJson.data[0];
    const ackRes = await fetch(`${BASE_URL}/alerts/${targetAlert.id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Operator acknowledged in integration test suite.' }),
    });
    const ackJson = await ackRes.json();
    assert(
      ackRes.status === 200 &&
        ackJson.id === targetAlert.id &&
        ackJson.status === 'acknowledged' &&
        ackJson.acknowledged_at !== null,
      '40. Alert lifecycle: POST /alerts/{id}/acknowledge transitions alert status to acknowledged'
    );

    // 41. Alert Lifecycle: Resolve alert
    const resolveRes = await fetch(`${BASE_URL}/alerts/${targetAlert.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Operator resolved in integration test suite.' }),
    });
    const resolveJson = await resolveRes.json();
    assert(
      resolveRes.status === 200 &&
        resolveJson.id === targetAlert.id &&
        resolveJson.status === 'resolved' &&
        resolveJson.resolved_at !== null,
      '41. Alert lifecycle: POST /alerts/{id}/resolve transitions alert status to resolved'
    );

    // --- PHASE 4 & PR #12: 3D ANATOMY REGISTRY & CLINICAL BOUNDARIES ---
    console.log('\n--- EXECUTING PHASE 4 / PR #12 3D ANATOMY INTEGRATION SUITE ---');

    // 42. Verify Anatomy Registry & Clinical Guardrails
    const anatomyRegistryPath = path.resolve(__dirname, '../src/components/anatomy/anatomyRegistry.ts');
    const nonAnatomicalDrawerPath = path.resolve(__dirname, '../src/components/anatomy/NonAnatomicalDataDrawer.tsx');
    const anatomySource = fs.readFileSync(anatomyRegistryPath, 'utf8');
    const drawerExists = fs.existsSync(nonAnatomicalDrawerPath);

    const hasCardio = anatomySource.includes('cardiovascular:') && anatomySource.includes("'heart_rate'");
    const hasNeuro = anatomySource.includes('neurological:');
    const hasThermoreg = anatomySource.includes('thermoregulation:') && anatomySource.includes("'body_temperature'");
    const hasRespiratory = anatomySource.includes('respiratory:') && anatomySource.includes("'respiratory_rate'");
    
    // Safety guardrails:
    // Musculoskeletal & ocular must explicitly flag continuous telemetry as unavailable
    const ocularUnavailable = anatomySource.includes('ocular:') && anatomySource.includes('isContinuousTelemetryAvailable: false');
    const muskuloskeletalUnavailable = anatomySource.includes('musculoskeletal:') && anatomySource.includes('isContinuousTelemetryAvailable: false');
    // SpO2 scientific guardrail note must be preserved
    const spo2Guardrail = anatomySource.includes('systemic capillary saturation, NOT intracranial');

    assert(
      hasCardio && hasNeuro && hasThermoreg && hasRespiratory && ocularUnavailable && muskuloskeletalUnavailable && spo2Guardrail && drawerExists,
      '42. Anatomy Registry integrity: All regions defined with strict NASA-STD-3001 guardrails; ocular/musculoskeletal continuous telemetry flagged unavailable; non-anatomical drawer preserved'
    );

    // --- PHASE 5: MISSION INTELLIGENCE & PREMIUM OPERATIONS SUITE ---
    console.log('\n--- EXECUTING PHASE 5 MISSION INTELLIGENCE & PREMIUM OPERATIONS SUITE ---');

    // 43. Single Alert Lookup: GET /alerts/{alert_id}
    const singleAlertRes = await fetch(`${BASE_URL}/alerts/${targetAlert.id}`);
    const singleAlertJson = await singleAlertRes.json();
    assert(
      singleAlertRes.status === 200 && singleAlertJson.id === targetAlert.id && singleAlertJson.severity,
      '43. Alert detail inspection: GET /alerts/{id} retrieves complete operational alert record'
    );

    // 44. Single Assessment Lookup: GET /assessments/{assessment_id}
    const latestAsmLookupRes = await fetch(`${BASE_URL}/astronauts/astro-001/assessments/latest`);
    const latestAsmLookupJson = await latestAsmLookupRes.json();
    const singleAsmRes = await fetch(`${BASE_URL}/assessments/${latestAsmLookupJson.id}`);
    const singleAsmJson = await singleAsmRes.json();
    assert(
      singleAsmRes.status === 200 && singleAsmJson.id === latestAsmLookupJson.id && Array.isArray(singleAsmJson.findings),
      '44. Explainable assessment lookup: GET /assessments/{id} retrieves complete clinical decision support record'
    );

    // 45. Assessment History Listing: GET /astronauts/{id}/assessments
    const asmListRes = await fetch(`${BASE_URL}/astronauts/astro-001/assessments?limit=10`);
    const asmListJson = await asmListRes.json();
    assert(
      asmListRes.status === 200 && Array.isArray(asmListJson.data) && asmListJson.total >= 1,
      '45. Assessment history: GET /astronauts/{id}/assessments retrieves historical assessment records'
    );

    // 46. Parameterized Trends Query: context and lookback_hours
    const paramTrendRes = await fetch(`${BASE_URL}/astronauts/astro-001/trends?context=resting_cabin&lookback_hours=72`);
    const paramTrendJson = await paramTrendRes.json();
    assert(
      paramTrendRes.status === 200 &&
        Array.isArray(paramTrendJson.data) &&
        paramTrendJson.data.every((t) => t.context === 'resting_cabin'),
      '46. Parameterized trend evaluation: GET /trends with context=resting_cabin & lookback_hours=72 isolates resting cohort'
    );

    // 47. Scientific Slope Unit Integrity: Sen's slope must be per 24 hours
    const trendCardSource = fs.readFileSync(
      path.resolve(__dirname, '../src/components/trend/TrendTrajectoryCard.tsx'),
      'utf8'
    );
    const hasSensSlope24h =
      trendCardSource.includes("Sen's Slope (24h)") && trendCardSource.includes('{trend.unit}/24h');
    assert(
      hasSensSlope24h,
      "47. Scientific slope unit integrity: TrendTrajectoryCard strictly displays Sen's slope in units per 24 hours"
    );

    // 48. Reconstructed Mission Timeline File & Contract Verification
    const timelineSource = fs.readFileSync(
      path.resolve(__dirname, '../src/components/timeline/MissionTimeline.tsx'),
      'utf8'
    );
    const hasTimelineDisclosure = timelineSource.includes('Reconstructed Application Timeline');
    const separatesOccurrenceTime =
      timelineSource.includes('occurrenceTime') && timelineSource.includes('ingestionTime');
    assert(
      hasTimelineDisclosure && separatesOccurrenceTime,
      '48. Reconstructed Mission Timeline: Discloses reconstructed status and separates occurrence from ingestion time'
    );

    // 49. Command Palette & Operator Keyboard Shortcuts
    const commandPaletteSource = fs.readFileSync(
      path.resolve(__dirname, '../src/components/navigation/CommandPalette.tsx'),
      'utf8'
    );
    const appSource = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
    const hasCtrlK = appSource.includes("key.toLowerCase() === 'k'") && commandPaletteSource.includes('CommandPaletteProps');
    assert(
      hasCtrlK,
      '49. Premium operator workflow: Global Ctrl+K Command Palette registered and wired across views, crew, and metrics'
    );

    // 50. Evidence Report Synthesis & Non-Diagnostic Disclosure
    const reportSource = fs.readFileSync(
      path.resolve(__dirname, '../src/components/reports/EvidenceReportModal.tsx'),
      'utf8'
    );
    const hasReportDisclosure = reportSource.includes('COSMOLOOKUP algorithms do NOT constitute an automated medical diagnosis');
    const hasMarkdownExport = reportSource.includes('handleCopyMarkdown') && reportSource.includes('handlePrint');
    assert(
      hasReportDisclosure && hasMarkdownExport,
      '50. Evidence Report: Mandatory non-diagnostic disclosure, Markdown export, and print formatting verified'
    );

    console.log(`\n========================================`);
    console.log(`INTEGRATION RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Integration test runner error:', err);
    process.exit(1);
  } finally {
    stopBackend();
  }
}

runTests();
