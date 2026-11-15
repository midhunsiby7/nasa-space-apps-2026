import * as THREE from 'three';
import {
  AnatomyComponentMetadata,
  AnatomyViewMode,
  isMeshVisibleInMode,
} from './anatomyModel';
import { ComponentWarningState } from './anatomyWarnings';

export interface VisualStateUpdateParams {
  mesh: THREE.Mesh;
  component: AnatomyComponentMetadata;
  isSelected: boolean;
  isHovered: boolean;
  warningState: ComponentWarningState;
  viewMode: AnatomyViewMode;
  pulseTime: number;
  isWireframe?: boolean;
}

/**
 * Applies visual styling, transparency, emissive pulsing, and raycasting behavior
 * to a cloned GLTF mesh instance.
 */
export function applyMeshVisualState({
  mesh,
  component,
  isSelected,
  isHovered,
  warningState,
  viewMode,
  pulseTime,
  isWireframe = false,
}: VisualStateUpdateParams): void {
  const visible = isMeshVisibleInMode(component.layer, viewMode);
  mesh.visible = visible;
  if (!visible) return;

  // Raycasting guardrail: disable raycasting on the outer shell so it never blocks clicks
  if (component.id === 'body_shell') {
    mesh.raycast = () => null;
  }

  // Ensure material is MeshStandardMaterial or MeshPhysicalMaterial
  const mat = mesh.material as THREE.MeshStandardMaterial;
  if (!mat || !('color' in mat)) return;

  mat.wireframe = isWireframe;

  // 1. Base Opacity and Blending by Layer & Mode
  if (component.id === 'body_shell') {
    mat.transparent = true;
    mat.opacity = 0.16;
    mat.depthWrite = false;
    mesh.renderOrder = 20;
    mat.roughness = 0.6;
    mat.metalness = 0.1;
  } else if (component.id === 'muscles') {
    if (viewMode === 'muscles') {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.depthWrite = true;
      mesh.renderOrder = 1;
    } else {
      // In full mode, keep muscles semi-translucent so internal organs remain visible
      mat.transparent = true;
      mat.opacity = 0.32;
      mat.depthWrite = false;
      mesh.renderOrder = 10;
    }
  } else {
    // Internal organs, bones, nerves, vessels
    mat.transparent = false;
    mat.opacity = 1.0;
    mat.depthWrite = true;
    mesh.renderOrder = 2;
  }

  // 2. Selection & Hover Highlights (Steady Cyan)
  const cyanColor = new THREE.Color('#06b6d4');
  const hoverCyan = new THREE.Color('#38bdf8');
  const amberCaution = new THREE.Color('#f59e0b');
  const roseCritical = new THREE.Color('#f43f5e');

  if (isSelected) {
    mat.color.copy(cyanColor);
    mat.emissive.copy(cyanColor);
    mat.emissiveIntensity = 0.55;
    mat.roughness = 0.2;
    mat.metalness = 0.4;
    if (component.id === 'muscles' || component.id === 'body_shell') {
      mat.opacity = Math.max(mat.opacity, 0.65);
    }
    return;
  }

  if (isHovered) {
    mat.color.copy(hoverCyan);
    mat.emissive.copy(hoverCyan);
    mat.emissiveIntensity = 0.35;
    return;
  }

  // 3. Warning Pulse States (Independent of Selection)
  if (warningState.level === 'critical') {
    // Rapid pulse (~1.8 Hz)
    const pulseFactor = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(pulseTime * 11.0));
    mat.color.lerpColors(new THREE.Color(component.defaultColor), roseCritical, 0.8);
    mat.emissive.copy(roseCritical);
    mat.emissiveIntensity = 0.5 + pulseFactor * 1.6;
    if (component.id === 'body_shell' || component.id === 'muscles') {
      mat.opacity = Math.max(mat.opacity, 0.7);
    }
    return;
  }

  if (warningState.level === 'caution') {
    // Slower pulse (~1.0 Hz)
    const pulseFactor = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(pulseTime * 6.0));
    mat.color.lerpColors(new THREE.Color(component.defaultColor), amberCaution, 0.7);
    mat.emissive.copy(amberCaution);
    mat.emissiveIntensity = 0.4 + pulseFactor * 1.3;
    if (component.id === 'body_shell' || component.id === 'muscles') {
      mat.opacity = Math.max(mat.opacity, 0.55);
    }
    return;
  }

  // 4. Nominal Normal State
  mat.color.set(component.defaultColor);
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  mat.roughness = 0.45;
  mat.metalness = 0.2;
}
