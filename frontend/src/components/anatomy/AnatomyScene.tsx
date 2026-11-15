import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Human3DModel } from './Human3DModel';
import {
  AnatomicalStructureId,
  AnatomicalSystemId,
  ANATOMICAL_STRUCTURES,
} from './anatomyRegistry';

export type CameraViewAngle = 'front' | 'back' | 'left' | 'right' | 'reset' | null;

interface AnatomySceneProps {
  selectedStructure: AnatomicalStructureId | null;
  onSelectStructure: (structure: AnatomicalStructureId | null) => void;
  hoveredStructure: AnatomicalStructureId | null;
  onHoverStructure: (structure: AnatomicalStructureId | null) => void;
  visibleSystems: Partial<Record<AnatomicalSystemId, boolean>>;
  isWireframe?: boolean;
  shellOpacity?: number;
  isIsolated?: boolean;
  viewAngle?: CameraViewAngle;
  onViewAngleApplied?: () => void;
  onFallbackTo2D: () => void;
  resetTrigger?: number;
  // Backwards compatibility props
  selectedRegion?: AnatomicalStructureId;
  onSelectRegion?: (region: AnatomicalStructureId) => void;
  hoveredRegion?: AnatomicalStructureId | null;
  onHoverRegion?: (region: AnatomicalStructureId | null) => void;
}

/**
 * Camera controller interpolating position and OrbitControls focus point
 * when the user selects different anatomical structures or triggers view angle shortcuts.
 */
const CameraFocusController: React.FC<{
  selectedStructure: AnatomicalStructureId | null;
  viewAngle: CameraViewAngle;
  onViewAngleApplied?: () => void;
  controlsRef: React.RefObject<any>;
  resetTrigger?: number;
}> = ({ selectedStructure, viewAngle, onViewAngleApplied, controlsRef, resetTrigger }) => {
  const { camera } = useThree();

  const defaultPosition = useMemo(() => new THREE.Vector3(0, 0.05, 2.6), []);
  const defaultTarget = useMemo(() => new THREE.Vector3(0, 0.0, 0), []);

  const [activeTarget, setActiveTarget] = useState<THREE.Vector3>(defaultTarget);
  const [activePosition, setActivePosition] = useState<THREE.Vector3>(defaultPosition);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Handle View Angle shortcuts (Front, Back, Left, Right, Reset)
  useEffect(() => {
    if (!viewAngle) return;

    let pos = new THREE.Vector3(0, 0.05, 2.6);
    const target = new THREE.Vector3(0, 0.0, 0);

    switch (viewAngle) {
      case 'front':
        pos = new THREE.Vector3(0, 0.05, 2.6);
        break;
      case 'back':
        pos = new THREE.Vector3(0, 0.05, -2.6);
        break;
      case 'left':
        pos = new THREE.Vector3(-2.6, 0.05, 0);
        break;
      case 'right':
        pos = new THREE.Vector3(2.6, 0.05, 0);
        break;
      case 'reset':
      default:
        pos = new THREE.Vector3(0, 0.05, 2.6);
        break;
    }

    setActivePosition(pos);
    setActiveTarget(target);
    setIsTransitioning(true);

    if (onViewAngleApplied) {
      onViewAngleApplied();
    }
  }, [viewAngle, onViewAngleApplied]);

  // Handle external reset button trigger
  const prevResetRef = useRef(resetTrigger);
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger !== prevResetRef.current) {
      prevResetRef.current = resetTrigger;
      setActivePosition(defaultPosition);
      setActiveTarget(defaultTarget);
      setIsTransitioning(true);
    }
  }, [resetTrigger, defaultPosition, defaultTarget]);

  // Handle structure selection camera transition
  useEffect(() => {
    if (viewAngle) return; // view angle shortcut takes precedence

    if (selectedStructure) {
      const config = ANATOMICAL_STRUCTURES[selectedStructure];
      if (config) {
        setActiveTarget(new THREE.Vector3(...config.cameraTarget));
        setActivePosition(new THREE.Vector3(...config.cameraPosition));
        setIsTransitioning(true);
      }
    } else {
      // Revert to full-body view
      setActivePosition(defaultPosition);
      setActiveTarget(defaultTarget);
      setIsTransitioning(true);
    }
  }, [selectedStructure, defaultPosition, defaultTarget, viewAngle]);

  // Smooth lerp camera movement
  useFrame((_, delta) => {
    if (!isTransitioning) return;

    const step = Math.min(delta * 3.5, 0.18);
    camera.position.lerp(activePosition, step);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(activeTarget, step);
      controlsRef.current.update();
    }

    // Stop transitioning when close enough to save cycles
    if (
      camera.position.distanceTo(activePosition) < 0.01 &&
      (controlsRef.current ? controlsRef.current.target.distanceTo(activeTarget) < 0.01 : true)
    ) {
      setIsTransitioning(false);
    }
  });

  return null;
};

/**
 * Ground HUD Ring & Orientation Compass
 */
const HolographicFloorStage: React.FC = () => {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.04;
    }
  });

  return (
    <group position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer rotating compass rings */}
      <group ref={ringRef}>
        <mesh>
          <ringGeometry args={[1.15, 1.18, 64]} />
          <meshBasicMaterial color="#0284c7" opacity={0.35} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.82, 0.84, 48]} />
          <meshBasicMaterial color="#0ea5e9" opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Tick marks */}
        <mesh>
          <ringGeometry args={[0.5, 0.51, 32]} />
          <meshBasicMaterial color="#38bdf8" opacity={0.15} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Target Crosshair */}
      <mesh>
        <planeGeometry args={[2.5, 0.015]} />
        <meshBasicMaterial color="#0284c7" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[2.5, 0.015]} />
        <meshBasicMaterial color="#0284c7" opacity={0.15} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Center pedestal glow */}
      <mesh>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="#38bdf8" opacity={0.07} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/**
 * Loading indicator rendered while GLTF asset is fetching
 */
const CanvasLoadingIndicator: React.FC = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center rounded-lg border border-telemetry-cyan/40 bg-space-950/90 p-5 shadow-2xl backdrop-blur-md min-w-[260px] text-center pointer-events-none">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-space-700 border-t-telemetry-cyan mb-3" />
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-telemetry-cyan">
          Loading 3D Anatomy Atlas
        </div>
        <div className="w-full bg-space-800 rounded-full h-1.5 mt-2.5 overflow-hidden border border-space-700">
          <div
            className="bg-telemetry-cyan h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <div className="font-mono text-[10px] text-space-400 mt-1.5">
          {Math.round(progress)}% • Optimizing mesh geometry
        </div>
      </div>
    </Html>
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
          <div className="h-10 w-10 text-amber-400 mb-3 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-lg">
            ⚠️
          </div>
          <h4 className="font-mono text-sm font-bold text-amber-300 uppercase tracking-wider">
            WebGL Acceleration Error
          </h4>
          <p className="font-mono text-xs text-space-400 mt-2 max-w-sm">
            Hardware acceleration was interrupted. You can inspect the anatomy using the interactive 2D anatomical schematic.
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

export const AnatomyScene: React.FC<AnatomySceneProps> = ({
  selectedStructure,
  onSelectStructure,
  hoveredStructure,
  onHoverStructure,
  visibleSystems,
  isWireframe = false,
  shellOpacity = 0.16,
  isIsolated = false,
  viewAngle = null,
  onViewAngleApplied,
  onFallbackTo2D,
  resetTrigger = 0,
  // Backwards compatibility props
  selectedRegion,
  onSelectRegion,
  hoveredRegion,
  onHoverRegion,
}) => {
  const controlsRef = useRef<any>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState<boolean>(true);

  // Normalize structure props
  const activeSelected = selectedStructure ?? selectedRegion ?? null;
  const activeHovered = hoveredStructure ?? hoveredRegion ?? null;

  const handleSelect = (id: AnatomicalStructureId | null) => {
    onSelectStructure(id);
    if (onSelectRegion && id) onSelectRegion(id);
  };

  const handleHover = (id: AnatomicalStructureId | null) => {
    onHoverStructure(id);
    if (onHoverRegion) onHoverRegion(id);
  };

  // Runtime WebGL support check
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
      <div className="relative h-full w-full select-none overflow-hidden rounded-lg bg-gradient-to-b from-[#070d19] via-[#0b1424] to-[#050a14]">
        <Canvas
          camera={{ position: [0, 0.05, 2.6], fov: 42, near: 0.1, far: 25 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          className="h-full w-full"
        >
          {/* Medical Studio Lighting */}
          <ambientLight intensity={0.7} color="#94a3b8" />
          <directionalLight position={[3, 5, 4]} intensity={1.25} color="#ffffff" />
          <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#38bdf8" />
          <directionalLight position={[0, -3, -4]} intensity={0.5} color="#818cf8" />
          <pointLight position={[0, 0.35, 0.9]} intensity={0.4} distance={3.5} color="#0ea5e9" />
          <pointLight position={[0, -0.2, 0.7]} intensity={0.3} distance={2.5} color="#f59e0b" />

          {/* Interactive 3D Human Anatomy Model */}
          <Suspense fallback={<CanvasLoadingIndicator />}>
            <Human3DModel
              selectedStructure={activeSelected}
              onSelectStructure={handleSelect}
              hoveredStructure={activeHovered}
              onHoverStructure={handleHover}
              visibleSystems={visibleSystems}
              isWireframe={isWireframe}
              shellOpacity={shellOpacity}
              isIsolated={isIsolated}
            />
          </Suspense>

          {/* Holographic Floor Compass Stage */}
          <HolographicFloorStage />

          {/* Orbit Controls with unrestricted 360-degree rotation */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={0.6}
            maxDistance={5.5}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI - 0.05}
            enablePan={true}
            panSpeed={0.8}
            rotateSpeed={0.85}
            zoomSpeed={1.0}
          />

          {/* Smooth Camera Interpolation Controller */}
          <CameraFocusController
            selectedStructure={activeSelected}
            viewAngle={viewAngle}
            onViewAngleApplied={onViewAngleApplied}
            controlsRef={controlsRef}
            resetTrigger={resetTrigger}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
};

export default AnatomyScene;
