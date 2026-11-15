import { useMemo } from 'react';
import * as THREE from 'three';
import { AnatomyComponentId, ANATOMY_COMPONENTS } from './anatomyModel';

export interface AnatomyFraming {
  defaultCameraPosition: THREE.Vector3;
  defaultLookAt: THREE.Vector3;
  desiredCameraPosition: THREE.Vector3;
  desiredLookAt: THREE.Vector3;
}

export function useAnatomyFraming(
  selectedComponent: AnatomyComponentId | null
): AnatomyFraming {
  return useMemo(() => {
    const defaultCameraPosition = new THREE.Vector3(0, 0.05, 2.3);
    const defaultLookAt = new THREE.Vector3(0, 0, 0);

    if (!selectedComponent || !ANATOMY_COMPONENTS[selectedComponent]) {
      return {
        defaultCameraPosition,
        defaultLookAt,
        desiredCameraPosition: defaultCameraPosition.clone(),
        desiredLookAt: defaultLookAt.clone(),
      };
    }

    const comp = ANATOMY_COMPONENTS[selectedComponent];
    const desiredLookAt = new THREE.Vector3(...comp.targetPosition);
    const desiredCameraPosition = new THREE.Vector3(...comp.cameraPosition);

    return {
      defaultCameraPosition,
      defaultLookAt,
      desiredCameraPosition,
      desiredLookAt,
    };
  }, [selectedComponent]);
}
