/**
 * COSMOLOOKUP 3D Human Anatomy Asset Verification Script
 * Validates the canonical 3D GLB model for integrity, size, glTF 2.0 structure,
 * and presence of all 13 required anatomical meshes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSET_PATH = path.resolve(__dirname, '../public/models/cosmolookup_human_anatomy_3d.glb');
const EXPECTED_SIZE = 1986996;

const EXPECTED_MESH_NODES = [
  'Brain_and_Spinal_Cord',
  'Skull_RibCage_Spine_Skeleton',
  'Lungs_and_Bronchial_Tree',
  'Heart_Myocardium',
  'Liver_Hepatic_Lobes',
  'Stomach_Gastric_Curvature',
  'Kidneys_Bilateral_Renal',
  'Intestines_Small_and_Large_Colon',
  'Urinary_Bladder_and_Ureters',
  'Major_Arteries_Red',
  'Major_Veins_Blue',
  'Muscular_Structures',
  'Human_Body_Structure_Outer_Shell',
];

function verifyAsset() {
  console.log('[VERIFY ASSET] Checking 3D Human Anatomy GLB model at:', ASSET_PATH);

  if (!fs.existsSync(ASSET_PATH)) {
    console.error('FAIL: GLB asset file not found at expected path:', ASSET_PATH);
    process.exit(1);
  }

  const stat = fs.statSync(ASSET_PATH);
  if (stat.size !== EXPECTED_SIZE) {
    console.error(`FAIL: Asset size mismatch. Expected ${EXPECTED_SIZE} bytes, got ${stat.size} bytes.`);
    process.exit(1);
  }
  console.log(`PASS: Asset file size exactly matches ${EXPECTED_SIZE} bytes.`);

  // Read header
  const fd = fs.openSync(ASSET_PATH, 'r');
  const headerBuf = Buffer.alloc(12);
  fs.readSync(fd, headerBuf, 0, 12, 0);

  const magic = headerBuf.toString('ascii', 0, 4);
  const version = headerBuf.readUInt32LE(4);
  const length = headerBuf.readUInt32LE(8);

  if (magic !== 'glTF') {
    console.error(`FAIL: Invalid glTF magic string. Expected 'glTF', got '${magic}'.`);
    process.exit(1);
  }
  if (version !== 2) {
    console.error(`FAIL: Expected glTF version 2, got ${version}.`);
    process.exit(1);
  }
  if (length !== EXPECTED_SIZE) {
    console.error(`FAIL: glTF header length (${length}) does not match file size (${EXPECTED_SIZE}).`);
    process.exit(1);
  }
  console.log(`PASS: Valid glTF 2.0 binary container (magic='glTF', version=2, length=${length}).`);

  // Read JSON chunk header
  const chunkHeaderBuf = Buffer.alloc(8);
  fs.readSync(fd, chunkHeaderBuf, 0, 8, 12);
  const jsonChunkLength = chunkHeaderBuf.readUInt32LE(0);
  const jsonChunkType = chunkHeaderBuf.toString('ascii', 4, 8);

  if (jsonChunkType !== 'JSON') {
    console.error(`FAIL: Expected first chunk type 'JSON', got '${jsonChunkType}'.`);
    process.exit(1);
  }

  const jsonBuf = Buffer.alloc(jsonChunkLength);
  fs.readSync(fd, jsonBuf, 0, jsonChunkLength, 20);
  fs.closeSync(fd);

  let gltf;
  try {
    gltf = JSON.parse(jsonBuf.toString('utf8'));
  } catch (err) {
    console.error('FAIL: Could not parse glTF JSON chunk:', err.message);
    process.exit(1);
  }

  const nodeNames = (gltf.nodes || []).map((n) => n.name).filter(Boolean);
  const meshNames = (gltf.meshes || []).map((m) => m.name).filter(Boolean);
  const allNames = new Set([...nodeNames, ...meshNames]);

  console.log(`[VERIFY ASSET] Inspecting ${nodeNames.length} nodes and ${meshNames.length} meshes in glTF...`);

  let allFound = true;
  for (const expected of EXPECTED_MESH_NODES) {
    if (allNames.has(expected)) {
      console.log(`  ✓ Found mesh node: "${expected}"`);
    } else {
      console.error(`  ✗ Missing expected mesh node: "${expected}"`);
      allFound = false;
    }
  }

  if (!allFound) {
    console.error('FAIL: One or more required anatomical mesh nodes are missing from the GLB.');
    process.exit(1);
  }

  console.log('\n[SUCCESS] All 13 anatomical meshes verified in canonical GLB asset!');
}

verifyAsset();
