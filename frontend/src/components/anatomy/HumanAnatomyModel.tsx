import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  AnatomyComponentId,
  AnatomyViewMode,
  ANATOMY_COMPONENTS,
  MESH_TO_COMPONENT_ID,
} from './anatomyModel';
import { ComponentWarningState } from './anatomyWarnings';
import { applyMeshVisualState } from './anatomyVisualState';

interface HumanAnatomyModelProps {
  selectedComponent: AnatomyComponentId | null;
  onSelectComponent: (componentId: AnatomyComponentId) => void;
  hoveredComponent: AnatomyComponentId | null;
  onHoverComponent: (componentId: AnatomyComponentId | null) => void;
  warningStates: Record<AnatomyComponentId, ComponentWarningState>;
  viewMode: AnatomyViewMode;
  isWireframe?: boolean;
}

export const HumanAnatomyModel: React.FC<HumanAnatomyModelProps> = ({
  selectedComponent,
  onSelectComponent,
  hoveredComponent,
  onHoverComponent,
  warningStates,
  viewMode,
  isWireframe = false,
}) => {
  // Load the authoritative 3D GLTF 2.0 model from public assets
  const { scene } = useGLTF('/models/cosmolookup_human_anatomy_3d.glb');

  // Clone scene graph and deep-clone materials to prevent mutating cached asset
  const { clonedScene, meshMap, modelCenter } = useMemo(() => {
    const cloned = scene.clone(true);
    const map = new Map<AnatomyComponentId, THREE.Mesh>();

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else {
            mesh.material = mesh.material.clone();
          }
        }

        const compId = MESH_TO_COMPONENT_ID[mesh.name];
        if (compId) {
          map.set(compId, mesh);
          // Set raycasting rule for outer shell
          if (compId === 'body_shell') {
            mesh.raycast = () => null;
          }
        }
      }
    });

    // Compute bounding box to center at origin
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return { clonedScene: cloned, meshMap: map, modelCenter: center };
  }, [scene]);

  // Frame update loop for emissive warning pulses and visual updates
  useFrame((state) => {
    const pulseTime = state.clock.getElapsedTime();

    meshMap.forEach((mesh, compId) => {
      const comp = ANATOMY_COMPONENTS[compId];
      if (!comp) return;

      const isSelected = selectedComponent === compId;
      const isHovered = hoveredComponent === compId;
      const warning = warningStates[compId] || { level: 'nominal', activeAlertCount: 0 };

      applyMeshVisualState({
        mesh,
        component: comp,
        isSelected,
        isHovered,
        warningState: warning,
        viewMode,
        pulseTime,
        isWireframe,
      });
    });
  });

  return (
    <group position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
      <primitive
        object={clonedScene}
        onPointerDown={(e: any) => {
          e.stopPropagation();
          const clickedMesh = e.object as THREE.Mesh;
          const compId = MESH_TO_COMPONENT_ID[clickedMesh?.name];
          if (compId && compId !== 'body_shell') {
            onSelectComponent(compId);
          }
        }}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          const hoveredMesh = e.object as THREE.Mesh;
          const compId = MESH_TO_COMPONENT_ID[hoveredMesh?.name];
          if (compId && compId !== 'body_shell') {
            onHoverComponent(compId);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          onHoverComponent(null);
          document.body.style.cursor = 'auto';
        }}
      />
    </group>
  );
};

// Preload GLTF asset into cache
useGLTF.preload('/models/cosmolookup_human_anatomy_3d.glb');
