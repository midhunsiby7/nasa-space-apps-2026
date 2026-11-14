import React, { Suspense, useRef, useEffect, useState, Component, ErrorInfo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Human3DModel } from './Human3DModel';
import { AnatomicalRegionId, ANATOMICAL_REGIONS } from './anatomyRegistry';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AnatomySceneProps {
  selectedRegion: AnatomicalRegionId;
  onSelectRegion: (region: AnatomicalRegionId) => void;
  hoveredRegion: AnatomicalRegionId | null;
  onHoverRegion: (region: AnatomicalRegionId | null) => void;
  isWireframe?: boolean;
  cameraResetKey?: number;
}

// Camera interpolator for smooth focus transitions
const CameraController: React.FC<{
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  resetTrigger: number;
}> = ({ targetPosition, targetLookAt, resetTrigger }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetVec = useRef(new THREE.Vector3(...targetPosition));
  const lookAtVec = useRef(new THREE.Vector3(...targetLookAt));

  useEffect(() => {
    targetVec.current.set(...targetPosition);
    lookAtVec.current.set(...targetLookAt);
  }, [targetPosition, targetLookAt, resetTrigger]);

  useFrame(() => {
    // Smooth lerp camera position
    camera.position.lerp(targetVec.current, 0.04);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={1.6}
      maxDistance={6.0}
      target={lookAtVec.current}
      maxPolarAngle={Math.PI / 2 + 0.15}
    />
  );
};

// WebGL Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class WebGLErrorBoundary extends Component<{ children: React.ReactNode; onFallback: () => void }, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL / 3D Canvas initialization failure:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-space-950/90 rounded-lg border border-rose-500/30 text-space-200 min-h-[420px]">
          <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
          <h4 className="font-mono text-sm font-bold text-rose-300 uppercase">
            WebGL 3D Context Initialization Failed
          </h4>
          <p className="mt-1 text-xs text-space-400 max-w-md font-mono">
            Your browser or environment could not create a hardware-accelerated WebGL context. You can still inspect all anatomical telemetry regions using the accessible controls.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onFallback();
            }}
            className="mt-4 px-3 py-1.5 rounded bg-space-800 hover:bg-space-750 border border-space-600 text-xs font-mono text-space-200 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry WebGL Context
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AnatomyScene: React.FC<AnatomySceneProps> = ({
  selectedRegion,
  onSelectRegion,
  hoveredRegion,
  onHoverRegion,
  isWireframe = false,
  cameraResetKey = 0,
}) => {
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // Check WebGL support on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
      }
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  const activeRegionDef = ANATOMICAL_REGIONS[selectedRegion];
  const targetCamPos = activeRegionDef.cameraPosition;
  const targetCamLook = activeRegionDef.cameraTarget;

  if (!webGLSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-space-950/90 rounded-lg border border-amber-500/30 text-space-200 min-h-[440px]">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <h4 className="font-mono text-sm font-bold text-amber-300 uppercase">
          Hardware WebGL Acceleration Unavailable
        </h4>
        <p className="mt-1 text-xs text-space-400 max-w-md font-mono">
          WebGL rendering is disabled or unavailable. Telemetry channels and anatomical mappings remain fully functional through the region inspector and navigation modules.
        </p>
      </div>
    );
  }

  return (
    <WebGLErrorBoundary onFallback={() => setWebGLSupported(false)}>
      <div className="relative w-full h-[520px] rounded-lg overflow-hidden bg-space-950">
        <Canvas
          camera={{ position: [0, 0.4, 3.4], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          {/* Scientific Lighting Arrangement */}
          <ambientLight intensity={0.4} color="#38bdf8" />
          <directionalLight position={[3, 4, 3]} intensity={1.2} color="#ffffff" />
          <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[0, -2, 2]} intensity={0.3} color="#f43f5e" />

          {/* Coordinate Grid Floor */}
          <gridHelper args={[6, 12, '#273856', '#162032']} position={[0, -1.8, 0]} />

          {/* Camera Controller with interpolation */}
          <CameraController
            targetPosition={targetCamPos}
            targetLookAt={targetCamLook}
            resetTrigger={cameraResetKey}
          />

          {/* 3D Human Anatomy Model */}
          <Suspense
            fallback={
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshBasicMaterial wireframe color="#38bdf8" />
              </mesh>
            }
          >
            <Human3DModel
              selectedRegion={selectedRegion}
              onSelectRegion={onSelectRegion}
              hoveredRegion={hoveredRegion}
              onHoverRegion={onHoverRegion}
              isWireframe={isWireframe}
            />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
