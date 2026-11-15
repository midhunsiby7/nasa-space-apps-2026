import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { HumanAnatomyModel } from './HumanAnatomyModel';
import {
  AnatomyComponentId,
  AnatomyViewMode,
  ANATOMY_COMPONENTS,
} from './anatomyModel';
import { ComponentWarningState } from './anatomyWarnings';

interface AnatomySceneProps {
  selectedComponent: AnatomyComponentId | null;
  onSelectComponent: (component: AnatomyComponentId) => void;
  hoveredComponent: AnatomyComponentId | null;
  onHoverComponent: (component: AnatomyComponentId | null) => void;
  warningStates: Record<AnatomyComponentId, ComponentWarningState>;
  viewMode: AnatomyViewMode;
  isWireframe?: boolean;
  onFallbackTo2D: () => void;
  resetTrigger?: number;
}

/**
 * Camera controller interpolating position and OrbitControls focus point
 * when the user selects different anatomical components.
 */
const CameraFocusController: React.FC<{
  selectedComponent: AnatomyComponentId | null;
  controlsRef: React.RefObject<any>;
  resetTrigger?: number;
}> = ({ selectedComponent, controlsRef, resetTrigger }) => {
  const { camera } = useThree();

  const defaultPosition = useMemo(() => new THREE.Vector3(0, 0.05, 2.3), []);
  const defaultTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const desiredTarget = useMemo(() => {
    if (!selectedComponent || !ANATOMY_COMPONENTS[selectedComponent]) {
      return defaultTarget;
    }
    return new THREE.Vector3(...ANATOMY_COMPONENTS[selectedComponent].targetPosition);
  }, [selectedComponent, defaultTarget]);

  const desiredPosition = useMemo(() => {
    if (!selectedComponent || !ANATOMY_COMPONENTS[selectedComponent]) {
      return defaultPosition;
    }
    return new THREE.Vector3(...ANATOMY_COMPONENTS[selectedComponent].cameraPosition);
  }, [selectedComponent, defaultPosition]);

  // Handle external reset button
  const prevResetRef = useRef(resetTrigger);
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger !== prevResetRef.current) {
      prevResetRef.current = resetTrigger;
      camera.position.copy(defaultPosition);
      if (controlsRef.current) {
        controlsRef.current.target.copy(defaultTarget);
        controlsRef.current.update();
      }
    }
  }, [resetTrigger, camera, controlsRef, defaultPosition, defaultTarget]);

  useFrame((_, delta) => {
    const step = Math.min(delta * 3.2, 0.15);
    camera.position.lerp(desiredPosition, step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget, step);
      controlsRef.current.update();
    }
  });

  return null;
};

/**
 * Ground HUD Ring & Holographic Pedestal Stage
 */
const HolographicFloorStage: React.FC = () => {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group position={[0, -0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer rotating ring */}
      <group ref={ringRef}>
        <mesh>
          <ringGeometry args={[0.9, 0.92, 64]} />
          <meshBasicMaterial color="#0284c7" opacity={0.35} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.65, 0.67, 48]} />
          <meshBasicMaterial color="#0ea5e9" opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Target Crosshair */}
      <mesh>
        <planeGeometry args={[2.0, 0.012]} />
        <meshBasicMaterial color="#0284c7" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[2.0, 0.012]} />
        <meshBasicMaterial color="#0284c7" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Center pedestal glow */}
      <mesh>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#38bdf8" opacity={0.08} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/**
 * WebGL Error Boundary to catch render failures gracefully and fall back to 2D
 */
class SceneErrorBoundary extends React.Component<
  { onFallback: () => void; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { onFallback: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AnatomyScene WebGL Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-space-900 border border-amber-500/30 rounded-lg">
          <div className="h-10 w-10 text-amber-400 mb-3 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
            ⚠️
          </div>
          <h4 className="font-mono text-sm font-bold text-amber-300 uppercase tracking-wider">
            WebGL Renderer Error
          </h4>
          <p className="font-mono text-xs text-space-400 mt-2 max-w-sm">
            Hardware acceleration or WebGL context was interrupted. Reverting to interactive 2D anatomical schematic.
          </p>
          <button
            onClick={() => this.props.onFallback()}
            className="mt-4 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded text-xs font-mono transition-colors"
          >
            Switch to 2D View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingCanvasFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-center p-3 rounded bg-space-900/90 border border-telemetry-cyan/30 text-telemetry-cyan font-mono text-xs">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-telemetry-cyan border-t-transparent" />
        <span>STREAMING 3D ANATOMICAL MESH...</span>
      </div>
    </Html>
  );
}

export const AnatomyScene: React.FC<AnatomySceneProps> = ({
  selectedComponent,
  onSelectComponent,
  hoveredComponent,
  onHoverComponent,
  warningStates,
  viewMode,
  isWireframe = false,
  onFallbackTo2D,
  resetTrigger = 0,
}) => {
  const controlsRef = useRef<any>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);

  // Runtime WebGL check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsWebGLSupported(false);
        onFallbackTo2D();
      }
    } catch {
      setIsWebGLSupported(false);
      onFallbackTo2D();
    }
  }, [onFallbackTo2D]);

  if (!isWebGLSupported) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-space-900 rounded-lg">
        <p className="font-mono text-xs text-space-400">
          WebGL context unavailable. Active display mode set to 2D schematic.
        </p>
        <button
          onClick={onFallbackTo2D}
          className="mt-3 px-3 py-1.5 rounded bg-space-800 text-xs font-mono text-telemetry-cyan border border-space-700"
        >
          View 2D Schematic
        </button>
      </div>
    );
  }

  return (
    <SceneErrorBoundary onFallback={onFallbackTo2D}>
      <div className="relative h-full w-full select-none overflow-hidden rounded-lg bg-gradient-to-b from-space-950 via-space-900 to-space-950">
        <Canvas
          camera={{ position: [0, 0.05, 2.3], fov: 45, near: 0.1, far: 20 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="h-full w-full"
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} color="#cbd5e1" />
          <directionalLight position={[2, 4, 3]} intensity={1.2} color="#f8fafc" />
          <directionalLight position={[-3, -1, -2]} intensity={0.65} color="#06b6d4" />
          <pointLight position={[0, 0.4, 1.2]} intensity={0.5} distance={3} color="#38bdf8" />
          <pointLight position={[0, -0.3, 0.8]} intensity={0.35} distance={2} color="#f59e0b" />

          {/* Suspense-wrapped 3D Model */}
          <Suspense fallback={<LoadingCanvasFallback />}>
            <HumanAnatomyModel
              selectedComponent={selectedComponent}
              onSelectComponent={onSelectComponent}
              hoveredComponent={hoveredComponent}
              onHoverComponent={onHoverComponent}
              warningStates={warningStates}
              viewMode={viewMode}
              isWireframe={isWireframe}
            />
          </Suspense>

          {/* Floor Grid / Holographic Stage */}
          <HolographicFloorStage />

          {/* Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={0.8}
            maxDistance={4.5}
            maxPolarAngle={Math.PI / 2 + 0.25}
            minPolarAngle={0.15}
            enablePan={false}
          />

          {/* Smooth Camera Director */}
          <CameraFocusController
            selectedComponent={selectedComponent}
            controlsRef={controlsRef}
            resetTrigger={resetTrigger}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
};
