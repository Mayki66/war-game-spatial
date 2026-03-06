import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CLOCK_SPEED, LEO_MULTIPLIER } from '../rules/constants';

export function OrbitRing({ radius, inclination, color }) { 
  return <group rotation={[inclination, 0, 0]}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.02, 64, 100]} /><meshBasicMaterial color={color} transparent opacity={0.3} /></mesh></group>; 
}

export function SatelliteModel({ type, color, isHighlighted }) {
  const mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.2, emissive: isHighlighted ? color : "#000000", emissiveIntensity: isHighlighted ? 0.8 : 0 });
  const panelMat = new THREE.MeshStandardMaterial({ color: "#1e3a8a", metalness: 0.9, roughness: 0.1, emissive: isHighlighted ? "#60a5fa" : "#000000", emissiveIntensity: isHighlighted ? 0.3 : 0 });
  if (type === "LEO") return <group scale={0.12}><mesh material={mat}><boxGeometry args={[1, 1, 1]} /></mesh><mesh material={panelMat} position={[1.5, 0, 0]}><boxGeometry args={[2, 0.1, 1]} /></mesh><mesh material={panelMat} position={[-1.5, 0, 0]}><boxGeometry args={[2, 0.1, 1]} /></mesh></group>;
  if (type === "MEO") return <group scale={0.15}><mesh material={mat} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 1.5, 16]} /></mesh><mesh material={panelMat} position={[1.2, 0, 0]}><boxGeometry args={[1.5, 0.1, 0.8]} /></mesh><mesh material={panelMat} position={[-1.2, 0, 0]}><boxGeometry args={[1.5, 0.1, 0.8]} /></mesh><mesh material={panelMat} position={[0, 1.2, 0]} rotation={[0, 0, Math.PI/2]}><boxGeometry args={[1.5, 0.1, 0.8]} /></mesh><mesh material={panelMat} position={[0, -1.2, 0]} rotation={[0, 0, Math.PI/2]}><boxGeometry args={[1.5, 0.1, 0.8]} /></mesh></group>;
  return <group scale={0.20}><mesh material={mat}><boxGeometry args={[1.5, 1.5, 1.5]} /></mesh><mesh material={mat} position={[0, 1, 0]}><sphereGeometry args={[0.6, 16, 16, 0, Math.PI]} /></mesh><mesh material={panelMat} position={[2.5, 0, 0]}><boxGeometry args={[3, 0.1, 1.5]} /></mesh><mesh material={panelMat} position={[-2.5, 0, 0]}><boxGeometry args={[3, 0.1, 1.5]} /></mesh></group>;
}

export function AnimatedSatellite({ data, isHighlighted, earthRef, onSelect }) {
  const satGroupRef = useRef();
  useFrame((state) => {
    if (!satGroupRef.current) return;
    let angle;
    if (data.orbit === "GEO") { angle = (earthRef.current ? earthRef.current.rotation.y : 0) + data.startAngle; } 
    else { const speedMult = data.orbit === "LEO" ? LEO_MULTIPLIER : 4; angle = state.clock.getElapsedTime() * CLOCK_SPEED * data.speed * speedMult + data.startAngle; }
    const r = data.currentRadius || data.radius; const i = data.inclination || 0;
    satGroupRef.current.position.x = r * Math.cos(angle); satGroupRef.current.position.y = r * Math.sin(angle) * Math.sin(i); satGroupRef.current.position.z = -r * Math.sin(angle) * Math.cos(i); satGroupRef.current.lookAt(0,0,0);
  });
  if (!data.isActive) return null;
  return (
    <>
      <group ref={satGroupRef} onClick={(e) => { e.stopPropagation(); onSelect(data); }}>
        <SatelliteModel type={data.orbit} color={data.color} isHighlighted={isHighlighted} />
      </group>
      {isHighlighted && <OrbitRing radius={data.currentRadius || data.radius} inclination={data.inclination || 0} color={data.color} />}
    </>
  );
}