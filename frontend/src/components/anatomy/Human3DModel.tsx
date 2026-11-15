import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  AnatomicalStructureId,
  AnatomicalSystemId,
  ANATOMICAL_STRUCTURES,
} from './anatomyRegistry';

export interface Human3DModelProps {
  selectedStructure?: AnatomicalStructureId | null;
  selectedRegion?: AnatomicalStructureId;
  onSelectStructure?: (structure: AnatomicalStructureId | null) => void;
  onSelectRegion?: (region: AnatomicalStructureId) => void;
  hoveredStructure?: AnatomicalStructureId | null;
  hoveredRegion?: AnatomicalStructureId | null;
  onHoverStructure?: (structure: AnatomicalStructureId | null) => void;
  onHoverRegion?: (region: AnatomicalStructureId | null) => void;
  visibleSystems?: Partial<Record<AnatomicalSystemId, boolean>>;
  isWireframe?: boolean;
  shellOpacity?: number;
  isIsolated?: boolean;
  allowShellRaycast?: boolean;
}

// Map GLB mesh name to AnatomicalStructureId
const MESH_TO_STRUCTURE: Record<string, AnatomicalStructureId> = {
  Mesh_Brain_and_Spinal_Cord: 'brain_spinal_cord',
  Mesh_Skull_RibCage_Spine_Skeleton: 'skeleton',
  Mesh_Lungs_and_Bronchial_Tree: 'lungs',
  Mesh_Heart_Myocardium: 'heart',
  Mesh_Liver_Hepatic_Lobes: 'liver',
  Mesh_Stomach_Gastric_Curvature: 'stomach',
  Mesh_Kidneys_Bilateral_Renal: 'kidneys',
  Mesh_Intestines_Small_and_Large_Colon: 'intestines',
  Mesh_Urinary_Bladder_and_Ureters: 'bladder',
  Mesh_Major_Arteries_Red: 'arteries',
  Mesh_Major_Veins_Blue: 'veins',
  Mesh_Muscular_Structures: 'muscles',
  Mesh_Human_Body_Structure_Outer_Shell: 'outer_shell',
};

const GLB_URL = '/models/cosmolookup_human_anatomy_3d.glb';

export const Human3DModel: React.FC<Human3DModelProps> = ({
  selectedStructure,
  selectedRegion,
  onSelectStructure,
  onSelectRegion,
  hoveredStructure,
  hoveredRegion,
  onHoverStructure,
  onHoverRegion,
  visibleSystems = {},
  isWireframe = false,
  shellOpacity = 0.16,
  isIsolated = false,
  allowShellRaycast = false,
}) => {
  // Normalize selection and hover props (supporting both modern and backward-compat names)
  const currentSelected = selectedStructure ?? selectedRegion ?? null;
  const currentHovered = hoveredStructure ?? hoveredRegion ?? null;

  const handleSelect = (id: AnatomicalStructureId | null) => {
    if (onSelectStructure) onSelectStructure(id);
    if (onSelectRegion && id) onSelectRegion(id);
  };

  const handleHover = (id: AnatomicalStructureId | null) => {
    if (onHoverStructure) onHoverStructure(id);
    if (onHoverRegion) onHoverRegion(id);
  };

  // Load GLB model
  const { scene } = useGLTF(GLB_URL);

  // Cloned scene to avoid mutating cached global GLTF asset
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Mesh references for dynamic physiological pulsation
  const heartMeshRef = useRef<THREE.Mesh | null>(null);
  const lungsMeshRef = useRef<THREE.Mesh | null>(null);
  const activeSelectedRef = useRef<THREE.Mesh | null>(null);

  // Map to store cloned dynamic materials per mesh
  const meshMaterialsMap = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>();

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name;
        const structureId = MESH_TO_STRUCTURE[meshName];

        // Clone material so changes are independent
        const originalMat = Array.isArray(mesh.material)
          ? mesh.material[0]
          : (mesh.material as THREE.MeshStandardMaterial);

        const newMat = originalMat
          ? (originalMat.clone() as THREE.MeshStandardMaterial)
          : new THREE.MeshStandardMaterial({
              color: structureId ? ANATOMICAL_STRUCTURES[structureId]?.color : '#94a3b8',
              roughness: 0.4,
              metalness: 0.1,
            });

        // Ensure side and precision
        newMat.side = THREE.DoubleSide;
        mesh.material = newMat;
        map.set(meshName, newMat);

        // Store reference to key animated organs
        if (structureId === 'heart') {
          heartMeshRef.current = mesh;
        } else if (structureId === 'lungs') {
          lungsMeshRef.current = mesh;
        }
      }
    });

    return map;
  }, [clonedScene]);

  // Update materials, opacities, and wireframe whenever selection, hover, or filters change
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const meshName = mesh.name;
      const structureId = MESH_TO_STRUCTURE[meshName];
      if (!structureId) return;

      const def = ANATOMICAL_STRUCTURES[structureId];
      const mat = meshMaterialsMap.get(meshName);
      if (!mat || !def) return;

      // Check system visibility
      const systemVisible = visibleSystems[def.systemId] !== false;
      mesh.visible = systemVisible;

      if (!systemVisible) return;

      const isSelected = currentSelected === structureId;
      const isHovered = currentHovered === structureId;
      const hasAnySelection = Boolean(currentSelected);

      if (isSelected) {
        activeSelectedRef.current = mesh;
      }

      // Outer shell special treatment (translucent contour)
      if (structureId === 'outer_shell') {
        mat.wireframe = isWireframe;
        mat.transparent = true;
        mat.opacity = shellOpacity;
        mat.color.set(isSelected ? '#00ffff' : '#38bdf8');
        mat.emissive.set(isSelected ? '#0ea5e9' : '#0369a1');
        mat.emissiveIntensity = isSelected ? 0.6 : isHovered ? 0.3 : 0.05;
        mat.depthWrite = false;
        mesh.raycast = allowShellRaycast ? THREE.Mesh.prototype.raycast : () => null;
        return;
      }

      // Standard organ materials
      mat.wireframe = isWireframe;

      // Check isolation mode
      if (isIsolated && hasAnySelection) {
        if (isSelected) {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.color.set(def.color);
          mat.emissive.set(def.highlightColor || '#00ffff');
          mat.emissiveIntensity = 0.8;
          mat.roughness = 0.25;
        } else {
          // Ghost unselected structures in isolate mode
          mat.transparent = true;
          mat.opacity = 0.07;
          mat.color.set('#334155');
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.8;
        }
        return;
      }

      // Normal display mode
      if (isSelected) {
        // High-contrast medical highlight
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.color.set(def.color);
        mat.emissive.set(def.highlightColor || '#00ffff');
        mat.emissiveIntensity = 0.85;
        mat.roughness = 0.2;
        mat.metalness = 0.15;
      } else if (isHovered) {
        // Interactive hover indicator
        mat.transparent = def.systemId === 'muscular';
        mat.opacity = def.systemId === 'muscular' ? 0.6 : 1.0;
        mat.color.set(def.color);
        mat.emissive.set('#38bdf8');
        mat.emissiveIntensity = 0.45;
        mat.roughness = 0.35;
      } else {
        // Default anatomical state
        if (def.systemId === 'muscular') {
          mat.transparent = true;
          mat.opacity = 0.32;
          mat.color.set(def.color);
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0.0;
          mat.roughness = 0.55;
        } else {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.color.set(def.color);
          mat.emissive.set('#050c18');
          mat.emissiveIntensity = 0.08;
          mat.roughness = 0.42;
          mat.metalness = 0.05;
        }
      }
    });
  }, [
    clonedScene,
    currentSelected,
    currentHovered,
    visibleSystems,
    isWireframe,
    shellOpacity,
    isIsolated,
    allowShellRaycast,
    meshMaterialsMap,
  ]);

  // Subtle physiological animations (resting cardiac pulse ~72 bpm, respiratory tide)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Cardiac myocardial pulse (~72 bpm = 1.2 Hz)
    if (heartMeshRef.current && heartMeshRef.current.visible) {
      const pulse = 1.0 + Math.sin(t * 7.54) * 0.04;
      heartMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    // Pulmonary respiration expansion (~14 breaths/min = 0.23 Hz)
    if (lungsMeshRef.current && lungsMeshRef.current.visible) {
      const resp = 1.0 + Math.sin(t * 1.46) * 0.025;
      lungsMeshRef.current.scale.set(resp, resp, resp);
    }

    // Selected organ glow breathing pulse
    if (currentSelected && activeSelectedRef.current) {
      const selectedMesh = activeSelectedRef.current;
      const mat = selectedMesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive) {
        const glowPulse = 0.7 + Math.sin(t * 4.0) * 0.2;
        mat.emissiveIntensity = glowPulse;
      }
    }
  });

  // Pointer event handlers with raycasting to detect exact mesh clicked
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const hitMesh = e.object as THREE.Mesh;
    const meshName = hitMesh.name;
    const structureId = MESH_TO_STRUCTURE[meshName];

    if (structureId) {
      handleSelect(structureId);
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const hitMesh = e.object as THREE.Mesh;
    const meshName = hitMesh.name;
    const structureId = MESH_TO_STRUCTURE[meshName];

    if (structureId && structureId !== 'outer_shell') {
      handleHover(structureId);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    handleHover(null);
    document.body.style.cursor = 'default';
  };

  // Click on background group to deselect
  const handleBackgroundClick = (e: any) => {
    if (e.target === e.currentTarget) {
      handleSelect(null);
    }
  };

  return (
    <group
      position={[0, 0, 0]}
      onClick={handleBackgroundClick}
      onPointerMissed={() => handleSelect(null)}
    >
      <primitive
        object={clonedScene}
        onClick={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  );
};

// Pre-load the GLB model in browser cache for instantaneous render
useGLTF.preload(GLB_URL);
