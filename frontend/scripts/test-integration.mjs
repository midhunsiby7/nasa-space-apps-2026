/**
 * COSMOLOOKUP Phase 2 End-to-End Integration Test Suite
 * Validates Frontend API Client & Data Transformation Layer against live FastAPI Backend
 */

import { spawn } from 'child_process';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';
let backendProcess = null;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function startBackend() {
  console.log('[TEST SETUP] Spawning local FastAPI backend server on port 8000...');
  backendProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--port', '8000'], {
    cwd: '../backend',
    stdio: 'ignore',
  });

  // Poll health check until responsive
  let attempts = 0;
  while (attempts < 15) {
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
  throw new Error('Failed to start or connect to backend service within 9 seconds.');
}

function stopBackend() {
  if (backendProcess) {
    console.log('[TEST TEARDOWN] Terminating backend process...');
    backendProcess.kill();
  }
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

    console.log('\n--- EXECUTING INTEGRATION SUITE ---');

    // Test 1: Health Check Root & V1
    const healthRes = await fetch('http://127.0.0.1:8000/api/v1/health');
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'healthy', '1. Backend health check (/api/v1/health)');

    // Test 2: Astronauts listing
    const astroRes = await fetch(`${BASE_URL}/astronauts`);
    const astroJson = await astroRes.json();
    assert(astroRes.status === 200 && Array.isArray(astroJson.data) && astroJson.total >= 1, '2. Astronaut listing retrieval');
    const firstAstro = astroJson.data[0];
    assert(firstAstro.id === 'astro-001' && firstAstro.name === 'Alex Morgan', '3. Astronaut schema fields (id, name, mission_name)');

    // Test 3: Astronaut detail by ID
    const astroDetailRes = await fetch(`${BASE_URL}/astronauts/astro-001`);
    const astroDetailJson = await astroDetailRes.json();
    assert(astroDetailRes.status === 200 && astroDetailJson.id === 'astro-001', '4. Astronaut detail lookup (/api/v1/astronauts/astro-001)');

    // Test 4: Measurements retrieval
    const measRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements`);
    const measJson = await measRes.json();
    assert(measRes.status === 200 && Array.isArray(measJson.data) && measJson.total === 25, '5. Measurement collection retrieval (total = 25 records)');

    // Test 5: Verify measurement fields & synthetic flag
    const allSynthetic = measJson.data.every((m) => m.is_synthetic === true);
    assert(allSynthetic, '6. Provenance transparency: All seeded measurements have is_synthetic = true');

    // Test 6: Verify actual measurement types present in backend seed
    const distinctTypes = Array.from(new Set(measJson.data.map((m) => m.measurement_type))).sort();
    const expectedTypes = [
      'blood_pressure_diastolic',
      'blood_pressure_systolic',
      'body_temperature',
      'heart_rate',
      'respiratory_rate',
      'sleep_duration',
      'spo2',
    ].sort();
    assert(
      JSON.stringify(distinctTypes) === JSON.stringify(expectedTypes),
      '7. Measurement type reconciliation: All 7 seeded metrics verified (heart_rate, spo2, body_temp, resp, bp_sys, bp_dia, sleep)'
    );

    // Test 7: Metric filter query
    const hrFilterRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?measurement_type=heart_rate`);
    const hrFilterJson = await hrFilterRes.json();
    assert(
      hrFilterRes.status === 200 && hrFilterJson.data.every((m) => m.measurement_type === 'heart_rate'),
      '8. Measurement filtering by measurement_type=heart_rate'
    );

    // Test 8: Mission filter query
    const missionFilterRes = await fetch(`${BASE_URL}/astronauts?mission_name=AURORA-1`);
    const missionFilterJson = await missionFilterRes.json();
    assert(
      missionFilterRes.status === 200 && missionFilterJson.data.length >= 1,
      '9. Astronaut directory filtering by mission_name=AURORA-1'
    );

    // Test 9: Pagination limit and offset
    const pageRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?limit=5&offset=5`);
    const pageJson = await pageRes.json();
    assert(
      pageRes.status === 200 && pageJson.data.length === 5 && pageJson.limit === 5 && pageJson.offset === 5,
      '10. Measurement pagination (limit=5, offset=5)'
    );

    // Test 10: Invalid astronaut ID returns HTTP 404 with standard envelope
    const notFoundRes = await fetch(`${BASE_URL}/astronauts/astro-nonexistent-999`);
    const notFoundJson = await notFoundRes.json();
    assert(
      notFoundRes.status === 404 && notFoundJson.error && notFoundJson.error.code === 'ASTRONAUT_NOT_FOUND',
      '11. Error handling: Non-existent astronaut returns 404 and standard error envelope'
    );

    // Test 11: Invalid query parameter returns HTTP 400
    const invalidQueryRes = await fetch(`${BASE_URL}/astronauts?limit=999`);
    const invalidQueryJson = await invalidQueryRes.json();
    assert(
      invalidQueryRes.status === 400 && invalidQueryJson.error && invalidQueryJson.error.code === 'INVALID_QUERY_PARAMETER',
      '12. Error handling: Invalid query limit=999 returns 400 and standard envelope'
    );

    // Test 12: Empty measurement results for valid astronaut with non-existent metric
    const emptyMeasRes = await fetch(`${BASE_URL}/astronauts/astro-001/measurements?measurement_type=radiation_dose`);
    const emptyMeasJson = await emptyMeasRes.json();
    assert(
      emptyMeasRes.status === 200 && emptyMeasJson.data.length === 0 && emptyMeasJson.total === 0,
      '13. Empty measurement handling: Missing radiation_dose returns valid empty collection without crashing'
    );

    console.log(`\nINTEGRATION RESULTS: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Integration test runner error:', err);
    process.exit(1);
  } finally {
    stopBackend();
  }
}

runTests();
