import React, { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Stars, Trail, MeshTransmissionMaterial, Text } from "@react-three/drei";
import * as THREE from "three";
import { DetectionResult, GestureType, ShapeType } from "../types";

interface Scene3DProps {
  detectionResult: DetectionResult | null;
  isDarkMode: boolean;
  shape: ShapeType;
}

const ReactiveMesh: React.FC<{ detectionResult: DetectionResult | null; isDarkMode: boolean; shape: ShapeType }> = ({ detectionResult, isDarkMode, shape }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  const gesture = detectionResult?.gesture || GestureType.None;
  const pinch = detectionResult?.pinchState;
  
  // Target values for smooth transition
  const targetScale = useRef(1);
  const targetColor = useRef(new THREE.Color("#ffffff"));
  const targetRotationSpeed = useRef(0.5);
  const targetRoughness = useRef(0.2);
  const lastPinchPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    lastPinchPosRef.current = null;
  }, [shape]);

  // Memoize configs based on gesture
  useMemo(() => {
    switch (gesture) {
      case GestureType.Open_Palm:
        targetScale.current = 2.0;
        targetColor.current.set(isDarkMode ? "#00f0ff" : "#0066ff"); // Cyan/Blue
        targetRotationSpeed.current = 0.2;
        targetRoughness.current = 0.05;
        break;
      case GestureType.Closed_Fist:
        targetScale.current = 0.6;
        targetColor.current.set(isDarkMode ? "#ff0055" : "#cc0000"); // Red
        targetRotationSpeed.current = 0.0; // Stop
        targetRoughness.current = 0.8;
        break;
      case GestureType.Pointing_Up:
        targetScale.current = 1.2;
        targetColor.current.set(isDarkMode ? "#cc00ff" : "#8800cc"); // Purple
        targetRotationSpeed.current = 1.0;
        targetRoughness.current = 0.2;
        break;
      case GestureType.Victory:
        targetScale.current = 1.5;
        targetColor.current.set("#ffd700"); // Gold
        targetRotationSpeed.current = 3.0;
        targetRoughness.current = 0.0;
        break;
      case GestureType.Thumb_Up:
        targetScale.current = 1.3;
        targetColor.current.set("#00ff00"); // Green
        targetRotationSpeed.current = 1.0;
        break;
        case GestureType.Thumb_Down:
        targetScale.current = 0.8;
        targetColor.current.set("#555555"); // Grey
        targetRotationSpeed.current = 0.2;
        break;
      default:
        targetScale.current = 1.2;
        targetColor.current.set(isDarkMode ? "#ffffff" : "#333333");
        targetRotationSpeed.current = 0.5;
        targetRoughness.current = 0.3;
        break;
    }
  }, [gesture, isDarkMode]);

  useFrame((state, delta) => {
    const { viewport } = state;

    if (meshRef.current) {
      
      // Pinch to Drag Logic Overrides
      if (pinch && pinch.isPinching) {
        const pinchX = 0.5 - pinch.x;
        const pinchY = pinch.y;

        if (lastPinchPosRef.current) {
          const dx = pinchX - lastPinchPosRef.current.x;
          const dy = pinchY - lastPinchPosRef.current.y;
          const rotationSensitivity = Math.PI * 3;

          meshRef.current.rotation.y += dx * rotationSensitivity;
          meshRef.current.rotation.x += -dy * rotationSensitivity;
        }
        lastPinchPosRef.current = { x: pinchX, y: pinchY };

        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, delta * 15);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, delta * 15);

        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 0.9, delta * 10));

        if (materialRef.current) {
           materialRef.current.color.lerp(new THREE.Color("#ff8800"), delta * 10);
        }

      } else {
        // Default Floating / Gesture Logic
        lastPinchPosRef.current = null;
        
        // Lerp Scale
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale.current, delta * 3);
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale.current, delta * 3);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale.current, delta * 3);

        // Reset Position to center modified by gesture
        const targetY = gesture === GestureType.Pointing_Up ? 2 : gesture === GestureType.Pointing_Down ? -2 : 0;
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, delta * 2);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 2);
        
        if (materialRef.current) {
            // Lerp Color
            materialRef.current.color.lerp(targetColor.current, delta * 5);
        }
      }
    }

    if (materialRef.current && (!pinch || !pinch.isPinching)) {
        // Lerp Roughness
        materialRef.current.roughness = THREE.MathUtils.lerp(materialRef.current.roughness, targetRoughness.current, delta * 2);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
       <Trail width={2} color={new THREE.Color(isDarkMode ? "#00f0ff" : "#0000ff")} length={4} decay={1} local={false} stride={0} interval={1}>
        <mesh ref={meshRef}>
          {shape === ShapeType.Icosahedron && <icosahedronGeometry args={[1, 1]} />}
          {shape === ShapeType.Torus && <torusGeometry args={[0.7, 0.3, 24, 64]} />}
          {shape === ShapeType.Capsule && <capsuleGeometry args={[0.35, 1.3, 8, 24]} />}
          <MeshTransmissionMaterial
            ref={materialRef}
            backside
            backsideThickness={5}
            thickness={2}
            chromaticAberration={0.5}
            anisotropy={0.5}
            distortion={0.5}
            distortionScale={0.5}
            temporalDistortion={0.2}
            color={isDarkMode ? "#ffffff" : "#cccccc"}
            roughness={0.2}
            metalness={0.8}
            transmission={0.95}
          />
        </mesh>
      </Trail>
    </Float>
  );
};

const BackgroundEffects: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
    return (
        <>
         {isDarkMode && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
         <ambientLight intensity={isDarkMode ? 0.5 : 1} />
         <pointLight position={[10, 10, 10]} intensity={2} color={isDarkMode ? "#00f0ff" : "#ffffff"} />
         <pointLight position={[-10, -10, -10]} intensity={2} color={isDarkMode ? "#ff0055" : "#ffffff"} />
         <Environment preset={isDarkMode ? "city" : "studio"} />
        </>
    )
}

const Scene3D: React.FC<Scene3DProps> = ({ detectionResult, isDarkMode, shape }) => {
  return (
    <div className="absolute inset-0 z-0 h-full w-full">
      <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }}>
        <BackgroundEffects isDarkMode={isDarkMode} />
        <ReactiveMesh detectionResult={detectionResult} isDarkMode={isDarkMode} shape={shape} />
        <mesh position={[0,0,-10]}>
             <planeGeometry args={[100,100]} />
             <meshStandardMaterial color={isDarkMode ? "#050510" : "#f0f0f5"} transparent opacity={0.8} />
        </mesh>
      </Canvas>
    </div>
  );
};

export default Scene3D;
