import React, { useRef } from 'react';
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
  const leftLungRef = useRef<THREE.Mesh>(null);
  const rightLungRef = useRef<THREE.Mesh>(null);
  const sensorCapsuleRef = useRef<THREE.Group>(null);
  const brainRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  // Subtle physiological animations (rhythmic cardiac pulse, pulmonary ventilation)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Heartbeat pulse (~72 bpm / 1.2 Hz)
    if (heartRef.current) {
      const pulse = 1 + Math.sin(t * 7.5) * 0.05;
      heartRef.current.scale.set(pulse, pulse, pulse);
    }

    // Pulmonary respiration expansion (~14 breaths/min)
    if (leftLungRef.current && rightLungRef.current) {
      const resp = 1 + Math.sin(t * 1.5) * 0.04;
      leftLungRef.current.scale.set(resp, resp, resp);
      rightLungRef.current.scale.set(resp, resp, resp);
    }

    // Ingestible capsule visceral orbit in abdomen
    if (sensorCapsuleRef.current) {
      sensorCapsuleRef.current.rotation.y = t * 1.2;
    }

    // Ocular micro-saccade simulation
    if (leftEyeRef.current && rightEyeRef.current) {
      const saccade = Math.sin(t * 2.5) * 0.01;
      leftEyeRef.current.rotation.x = saccade;
      rightEyeRef.current.rotation.x = saccade;
    }
  });

  const getMaterialProps = (regionId: AnatomicalRegionId, defaultColor: string) => {
    const isSelected = selectedRegion === regionId;
    const isHovered = hoveredRegion === regionId;
    const accentColor = ANATOMICAL_REGIONS[regionId].color;

    if (isSelected) {
      return {
        color: new THREE.Color(accentColor),
        emissive: new THREE.Color(accentColor).multiplyScalar(0.55),
        roughness: 0.15,
        metalness: 0.35,
        transparent: true,
        opacity: 0.95,
        wireframe: isWireframe,
      };
    }

    if (isHovered) {
      return {
        color: new THREE.Color(accentColor).multiplyScalar(0.9),
        emissive: new THREE.Color(accentColor).multiplyScalar(0.3),
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
        wireframe: isWireframe,
      };
    }

    return {
      color: new THREE.Color(defaultColor),
      emissive: new THREE.Color('#0a1120'),
      roughness: 0.5,
      metalness: 0.2,
      transparent: true,
      opacity: 0.55,
      wireframe: isWireframe,
    };
  };

  const handlePointerDown = (e: any, regionId: AnatomicalRegionId) => {
    e.stopPropagation();
    onSelectRegion(regionId);
  };

  const handlePointerOver = (e: any, regionId: AnatomicalRegionId) => {
    e.stopPropagation();
    onHoverRegion(regionId);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    onHoverRegion(null);
  };

  return (
    <group position={[0, -0.2, 0]}>
      {/* =========================================================================
       * 1. CRANIAL & NEUROLOGICAL SYSTEM (Head, Brain, Cervical Spine)
       * ========================================================================= */}
      <group
        onClick={(e) => handlePointerDown(e, 'neurological')}
        onPointerOver={(e) => handlePointerOver(e, 'neurological')}
        onPointerOut={handlePointerOut}
      >
        {/* Cranium Shell */}
        <mesh position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.26, 28, 28]} />
          <meshStandardMaterial {...getMaterialProps('neurological', '#1e293b')} />
        </mesh>

        {/* Inner Brain Mass */}
        <mesh ref={brainRef} position={[0, 1.47, 0.02]}>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshStandardMaterial
            color={selectedRegion === 'neurological' ? '#06b6d4' : '#2dd4bf'}
            emissive={selectedRegion === 'neurological' ? '#06b6d4' : '#042f2e'}
            roughness={0.3}
            transparent
            opacity={0.8}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Neck / Cervical Segment */}
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.09, 0.11, 0.18, 16]} />
          <meshStandardMaterial {...getMaterialProps('neurological', '#1e293b')} />
        </mesh>
      </group>

      {/* =========================================================================
       * 2. OCULAR SYSTEM (Eyes & Optic Pathway - SANS Domain)
       * ========================================================================= */}
      <group
        onClick={(e) => handlePointerDown(e, 'ocular')}
        onPointerOver={(e) => handlePointerOver(e, 'ocular')}
        onPointerOut={handlePointerOut}
      >
        {/* Left Eye Orbit & Globe */}
        <mesh ref={leftEyeRef} position={[-0.09, 1.46, 0.23]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color={selectedRegion === 'ocular' ? '#38bdf8' : '#7dd3fc'}
            emissive={selectedRegion === 'ocular' ? '#0284c7' : '#0369a1'}
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Right Eye Orbit & Globe */}
        <mesh ref={rightEyeRef} position={[0.09, 1.46, 0.23]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color={selectedRegion === 'ocular' ? '#38bdf8' : '#7dd3fc'}
            emissive={selectedRegion === 'ocular' ? '#0284c7' : '#0369a1'}
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Optic Chiasm Conduit */}
        <mesh position={[0, 1.43, 0.15]}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
          <meshStandardMaterial {...getMaterialProps('ocular', '#38bdf8')} />
        </mesh>
      </group>

      {/* =========================================================================
       * 3. CARDIOVASCULAR SYSTEM (Heart, Aorta, Thoracic Circulation)
       * ========================================================================= */}
      <group
        onClick={(e) => handlePointerDown(e, 'cardiovascular')}
        onPointerOver={(e) => handlePointerOver(e, 'cardiovascular')}
        onPointerOut={handlePointerOut}
      >
        {/* Heart Muscle (Left-leaning mediastinum) */}
        <mesh ref={heartRef} position={[0.06, 0.60, 0.09]}>
          <sphereGeometry args={[0.095, 20, 20]} />
          <meshStandardMaterial
            color={selectedRegion === 'cardiovascular' ? '#f43f5e' : '#e11d48'}
            emissive={selectedRegion === 'cardiovascular' ? '#be123c' : '#881337'}
            roughness={0.2}
            metalness={0.4}
            transparent
            opacity={0.95}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Aortic Arch & Ascending Root */}
        <mesh position={[0.03, 0.74, 0.08]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.05, 0.02, 10, 18, Math.PI * 0.9]} />
          <meshStandardMaterial {...getMaterialProps('cardiovascular', '#f43f5e')} />
        </mesh>

        {/* Thoracic Cavity Envelope Outline */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.26, 0.23, 0.45, 20]} />
          <meshStandardMaterial {...getMaterialProps('cardiovascular', '#1e293b')} />
        </mesh>
      </group>

      {/* =========================================================================
       * 4. PULMONARY / RESPIRATORY SYSTEM (Lungs & Trachea)
       * ========================================================================= */}
      <group
        onClick={(e) => handlePointerDown(e, 'respiratory')}
        onPointerOver={(e) => handlePointerOver(e, 'respiratory')}
        onPointerOut={handlePointerOut}
      >
        {/* Left Pulmonary Lobe */}
        <mesh ref={leftLungRef} position={[-0.14, 0.64, 0.04]}>
          <capsuleGeometry args={[0.085, 0.28, 12, 16]} />
          <meshStandardMaterial
            color={selectedRegion === 'respiratory' ? '#10b981' : '#059669'}
            emissive={selectedRegion === 'respiratory' ? '#047857' : '#064e3b'}
            roughness={0.3}
            transparent
            opacity={0.8}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Right Pulmonary Lobe */}
        <mesh ref={rightLungRef} position={[0.16, 0.64, 0.04]}>
          <capsuleGeometry args={[0.085, 0.28, 12, 16]} />
          <meshStandardMaterial
            color={selectedRegion === 'respiratory' ? '#10b981' : '#059669'}
            emissive={selectedRegion === 'respiratory' ? '#047857' : '#064e3b'}
            roughness={0.3}
            transparent
            opacity={0.8}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Trachea */}
        <mesh position={[0, 0.92, 0.06]}>
          <cylinderGeometry args={[0.025, 0.025, 0.22, 12]} />
          <meshStandardMaterial {...getMaterialProps('respiratory', '#10b981')} />
        </mesh>
      </group>

      {/* =========================================================================
       * 5. CORE THERMOREGULATION (Abdomen & Ingestible Telemetry Sensor Capsule)
       * ========================================================================= */}
      <group
        onClick={(e) => handlePointerDown(e, 'thermoregulation')}
        onPointerOver={(e) => handlePointerOver(e, 'thermoregulation')}
        onPointerOut={handlePointerOut}
      >
        {/* Abdominal Visceral Shell */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.22, 0.20, 0.42, 20]} />
          <meshStandardMaterial {...getMaterialProps('thermoregulation', '#1e293b')} />
        </mesh>

        {/* Visceral Core Center */}
        <mesh position={[0, 0.16, 0.03]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial
            color={selectedRegion === 'thermoregulation' ? '#f59e0b' : '#d97706'}
            emissive={selectedRegion === 'thermoregulation' ? '#b45309' : '#78350f'}
            roughness={0.3}
            transparent
            opacity={0.85}
            wireframe={isWireframe}
          />
        </mesh>

        {/* Orbiting Ingestible Telemetry Capsule Pill */}
        <group ref={sensorCapsuleRef} position={[0, 0.16, 0]}>
          <mesh position={[0.18, 0, 0]}>
            <capsuleGeometry args={[0.02, 0.045, 8, 12]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
        </group>
      </group>

      {/* =========================================================================
       * 6. MUSCULOSKELETAL FRAMEWORK (Spine, Ribs, Pelvis, Limbs)
       * ========================================================================= */}
      <group
        onClick={(e) => handlePointerDown(e, 'musculoskeletal')}
        onPointerOver={(e) => handlePointerOver(e, 'musculoskeletal')}
        onPointerOut={handlePointerOut}
      >
        {/* Vertebral Column (Spine from Cervical to Lumbar) */}
        <mesh position={[0, 0.48, -0.11]}>
          <cylinderGeometry args={[0.032, 0.042, 0.95, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#475569')} />
        </mesh>

        {/* Clavicles */}
        <mesh position={[-0.18, 0.92, 0.02]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.018, 0.018, 0.24, 8]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#475569')} />
        </mesh>
        <mesh position={[0.18, 0.92, 0.02]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.018, 0.018, 0.24, 8]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#475569')} />
        </mesh>

        {/* Pelvic Girdle */}
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.21, 0.16, 0.20, 16]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>

        {/* Upper Limbs: Left Arm */}
        <mesh position={[-0.38, 0.58, 0]} rotation={[0, 0, 0.15]}>
          <capsuleGeometry args={[0.055, 0.45, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>
        <mesh position={[-0.45, 0.16, 0]} rotation={[0, 0, 0.08]}>
          <capsuleGeometry args={[0.045, 0.42, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>

        {/* Upper Limbs: Right Arm & Pulse Oximeter Sensor Wristband */}
        <mesh position={[0.38, 0.58, 0]} rotation={[0, 0, -0.15]}>
          <capsuleGeometry args={[0.055, 0.45, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>
        <mesh position={[0.45, 0.16, 0]} rotation={[0, 0, -0.08]}>
          <capsuleGeometry args={[0.045, 0.42, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>
        {/* Optical Sensor Wristband on Right Arm */}
        <mesh position={[0.48, -0.04, 0]}>
          <torusGeometry args={[0.052, 0.015, 8, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" />
        </mesh>

        {/* Lower Limbs: Left Thigh (Femur) & Calf */}
        <mesh position={[-0.12, -0.48, 0]}>
          <capsuleGeometry args={[0.075, 0.50, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>
        <mesh position={[-0.12, -1.02, 0]}>
          <capsuleGeometry args={[0.065, 0.52, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>

        {/* Lower Limbs: Right Thigh (Femur) & Calf */}
        <mesh position={[0.12, -0.48, 0]}>
          <capsuleGeometry args={[0.075, 0.50, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>
        <mesh position={[0.12, -1.02, 0]}>
          <capsuleGeometry args={[0.065, 0.52, 8, 12]} />
          <meshStandardMaterial {...getMaterialProps('musculoskeletal', '#334155')} />
        </mesh>
      </group>
    </group>
  );
};
