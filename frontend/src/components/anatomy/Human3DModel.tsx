import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnatomicalRegionId, ANATOMICAL_REGIONS } from './anatomyRegistry';

interface Human3DModelProps {
  selectedRegion: AnatomicalRegionId;
  onSelectRegion: (region: AnatomicalRegionId) => void;
  hoveredRegion: AnatomicalRegionId | null;
  onHoverRegion: (region: AnatomicalRegionId | null) => void;
  isWireframe?: boolean;
}

export const Human3DModel: React.FC<Human3DModelProps> = ({
  selectedRegion,
  onSelectRegion,
  hoveredRegion,
  onHoverRegion,
  isWireframe = false,
}) => {
  const heartRef = useRef<THREE.Mesh>(null);
  const lungsLeftRef = useRef<THREE.Mesh>(null);
  const lungsRightRef = useRef<THREE.Mesh>(null);
  const sensorCapsuleRef = useRef<THREE.Mesh>(null);
  const ringMarkerRef = useRef<THREE.Group>(null);

  // Subtle physiological animations (cardiac cycle & respiratory cadence)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Heartbeat pulse (~72 bpm = 1.2 Hz)
    if (heartRef.current) {
      const pulse = 1 + Math.sin(t * 7.5) * 0.045;
      heartRef.current.scale.set(pulse, pulse, pulse);
    }

    // Pulmonary respiratory expansion (~14 breaths/min = 0.23 Hz)
    if (lungsLeftRef.current && lungsRightRef.current) {
      const resp = 1 + Math.sin(t * 1.5) * 0.035;
      lungsLeftRef.current.scale.set(resp, resp, resp);
      lungsRightRef.current.scale.set(resp, resp, resp);
    }

    // Thermal sensor orbit pulse
    if (sensorCapsuleRef.current) {
      sensorCapsuleRef.current.rotation.y = t * 1.2;
    }

    // Target highlight ring rotation
    if (ringMarkerRef.current) {
      ringMarkerRef.current.rotation.z = t * 0.8;
    }
  });

  // Reusable materials helper based on selection and hover
  const getRegionMaterial = (regionId: AnatomicalRegionId, baseColor: string) => {
    const isSelected = selectedRegion === regionId;
    const isHovered = hoveredRegion === regionId;
    const regionDef = ANATOMICAL_REGIONS[regionId];
    const accentColor = regionDef.color;

    if (isSelected) {
      return {
        color: new THREE.Color(accentColor),
        emissive: new THREE.Color(accentColor).multiplyScalar(0.4),
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: 0.95,
        wireframe: isWireframe,
      };
    }

    if (isHovered) {
      return {
        color: new THREE.Color(accentColor).lerp(new THREE.Color('#ffffff'), 0.2),
        emissive: new THREE.Color(accentColor).multiplyScalar(0.25),
        roughness: 0.3,
        metalness: 0.3,
        transparent: true,
        opacity: 0.85,
        wireframe: isWireframe,
      };
    }

    return {
      color: new THREE.Color(baseColor),
      emissive: new THREE.Color('#070a0f'),
      roughness: 0.6,
      metalness: 0.2,
      transparent: true,
      opacity: 0.45,
      wireframe: isWireframe,
    };
  };

  // Materials configuration
  const matHead = useMemo(() => getRegionMaterial('cranial', '#1e2c45'), [selectedRegion, hoveredRegion, isWireframe]);
  const matCardio = useMemo(() => getRegionMaterial('cardiovascular', '#273856'), [selectedRegion, hoveredRegion, isWireframe]);
  const matResp = useMemo(() => getRegionMaterial('respiratory', '#273856'), [selectedRegion, hoveredRegion, isWireframe]);
  const matCore = useMemo(() => getRegionMaterial('thermoregulation', '#1e2c45'), [selectedRegion, hoveredRegion, isWireframe]);
  const matSkel = useMemo(() => getRegionMaterial('musculoskeletal', '#162032'), [selectedRegion, hoveredRegion, isWireframe]);
  const matLimbs = useMemo(() => getRegionMaterial('lower_limbs', '#162032'), [selectedRegion, hoveredRegion, isWireframe]);

  // Active target coordinates for highlight ring marker
  const targetPos = ANATOMICAL_REGIONS[selectedRegion].cameraTarget;

  return (
    <group position={[0, -0.2, 0]} dispose={null}>
      {/* ==================== 1. HEAD / CRANIAL ==================== */}
      <group
        position={[0, 1.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('cranial');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('cranial');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        {/* Neurocranium / Calvaria */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.22, 28, 28]} />
          <meshStandardMaterial {...matHead} />
        </mesh>
        {/* Viscerocranium / Facial Skeleton */}
        <mesh position={[0, -0.06, 0.08]} scale={[0.85, 1, 0.9]}>
          <boxGeometry args={[0.22, 0.22, 0.16]} />
          <meshStandardMaterial {...matHead} />
        </mesh>
        {/* Cervical Spine Column */}
        <mesh position={[0, -0.24, -0.02]}>
          <cylinderGeometry args={[0.07, 0.08, 0.18, 16]} />
          <meshStandardMaterial {...matSkel} />
        </mesh>
      </group>

      {/* ==================== 2. THORAX & SKELETON ==================== */}
      <group position={[0, 0.7, 0]}>
        {/* Shoulder Girdle / Clavicles */}
        <mesh
          position={[0, 0.22, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectRegion('musculoskeletal');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverRegion('musculoskeletal');
          }}
          onPointerOut={() => onHoverRegion(null)}
        >
          <boxGeometry args={[0.88, 0.08, 0.18]} />
          <meshStandardMaterial {...matSkel} />
        </mesh>

        {/* Ribcage Architectural Lattice */}
        <mesh
          position={[0, -0.05, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectRegion('cardiovascular');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverRegion('cardiovascular');
          }}
          onPointerOut={() => onHoverRegion(null)}
        >
          <cylinderGeometry args={[0.34, 0.28, 0.52, 24, 1, true]} />
          <meshStandardMaterial {...matCardio} />
        </mesh>

        {/* Sternum (Anterior Midline) */}
        <mesh position={[0, -0.04, 0.28]}>
          <boxGeometry args={[0.06, 0.38, 0.03]} />
          <meshStandardMaterial {...matSkel} />
        </mesh>

        {/* Thoracic Spine (Posterior Column) */}
        <mesh position={[0, -0.05, -0.25]}>
          <boxGeometry args={[0.07, 0.52, 0.08]} />
          <meshStandardMaterial {...matSkel} />
        </mesh>
      </group>

      {/* ==================== 3. INTERNAL CARDIOPULMONARY ORGANS ==================== */}
      {/* Heart Mediastinum Node */}
      <group
        position={[-0.04, 0.68, 0.06]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('cardiovascular');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('cardiovascular');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        <mesh ref={heartRef}>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#f43f5e"
            emissiveIntensity={selectedRegion === 'cardiovascular' ? 0.6 : 0.25}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
        {/* Aortic Arch Root */}
        <mesh position={[0.02, 0.12, -0.02]}>
          <cylinderGeometry args={[0.03, 0.035, 0.09, 12]} />
          <meshStandardMaterial color="#f43f5e" emissive="#9f1239" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Pulmonary Lobes (Lungs) */}
      <group
        position={[0, 0.68, 0.02]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('respiratory');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('respiratory');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        {/* Right Lung */}
        <mesh ref={lungsRightRef} position={[0.16, 0, 0]} scale={[0.12, 0.24, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial {...matResp} />
        </mesh>
        {/* Left Lung */}
        <mesh ref={lungsLeftRef} position={[-0.17, 0, 0]} scale={[0.11, 0.23, 0.11]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial {...matResp} />
        </mesh>
      </group>

      {/* ==================== 4. ABDOMEN & THERMOREGULATION ==================== */}
      <group
        position={[0, 0.24, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('thermoregulation');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('thermoregulation');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        {/* Abdominal Visceral Volume */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.27, 0.25, 0.38, 20]} />
          <meshStandardMaterial {...matCore} />
        </mesh>

        {/* Ingestible Thermal Sensor Pill Hotspot */}
        <mesh ref={sensorCapsuleRef} position={[0.03, -0.04, 0.08]}>
          <capsuleGeometry args={[0.03, 0.06, 8, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={selectedRegion === 'thermoregulation' ? 0.8 : 0.35}
            roughness={0.1}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* ==================== 5. PELVIS & MUSCULOSKELETAL FRAME ==================== */}
      <group
        position={[0, -0.04, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('musculoskeletal');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('musculoskeletal');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.22, 0.24, 16]} />
          <meshStandardMaterial {...matSkel} />
        </mesh>
      </group>

      {/* ==================== 6. UPPER EXTREMITIES ==================== */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('musculoskeletal');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('musculoskeletal');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        {/* Right Arm */}
        <group position={[0.48, 0.7, 0]}>
          {/* Shoulder joint */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial {...matSkel} />
          </mesh>
          {/* Brachium (upper arm) */}
          <mesh position={[0.05, -0.24, 0]}>
            <cylinderGeometry args={[0.06, 0.05, 0.38, 14]} />
            <meshStandardMaterial {...matSkel} />
          </mesh>
          {/* Antebrachium (forearm) */}
          <mesh position={[0.08, -0.62, 0]}>
            <cylinderGeometry args={[0.048, 0.04, 0.36, 14]} />
            <meshStandardMaterial {...matSkel} />
          </mesh>
        </group>

        {/* Left Arm */}
        <group position={[-0.48, 0.7, 0]}>
          {/* Shoulder joint */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial {...matSkel} />
          </mesh>
          {/* Brachium */}
          <mesh position={[-0.05, -0.24, 0]}>
            <cylinderGeometry args={[0.06, 0.05, 0.38, 14]} />
            <meshStandardMaterial {...matSkel} />
          </mesh>
          {/* Antebrachium */}
          <mesh position={[-0.08, -0.62, 0]}>
            <cylinderGeometry args={[0.048, 0.04, 0.36, 14]} />
            <meshStandardMaterial {...matSkel} />
          </mesh>
        </group>
      </group>

      {/* ==================== 7. LOWER EXTREMITIES ==================== */}
      <group
        position={[0, -0.2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectRegion('lower_limbs');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverRegion('lower_limbs');
        }}
        onPointerOut={() => onHoverRegion(null)}
      >
        {/* Right Leg */}
        <group position={[0.15, 0, 0]}>
          {/* Thigh (Femur segment) */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.1, 0.075, 0.52, 16]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
          {/* Knee joint (Patella) */}
          <mesh position={[0, -0.6, 0.03]}>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
          {/* Lower leg (Tibia/Fibula segment) */}
          <mesh position={[0, -0.92, 0]}>
            <cylinderGeometry args={[0.07, 0.055, 0.52, 16]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -1.2, 0.08]}>
            <boxGeometry args={[0.09, 0.06, 0.22]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
        </group>

        {/* Left Leg */}
        <group position={[-0.15, 0, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.1, 0.075, 0.52, 16]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
          {/* Knee joint */}
          <mesh position={[0, -0.6, 0.03]}>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0, -0.92, 0]}>
            <cylinderGeometry args={[0.07, 0.055, 0.52, 16]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -1.2, 0.08]}>
            <boxGeometry args={[0.09, 0.06, 0.22]} />
            <meshStandardMaterial {...matLimbs} />
          </mesh>
        </group>
      </group>

      {/* ==================== 8. HUD SELECTION TARGET RING ==================== */}
      <group ref={ringMarkerRef} position={targetPos}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.36, 32]} />
          <meshBasicMaterial
            color={ANATOMICAL_REGIONS[selectedRegion].color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.39, 32]} />
          <meshBasicMaterial
            color={ANATOMICAL_REGIONS[selectedRegion].color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};
