import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CLOCK_SPEED } from '../rules/constants';

export function Stars() { const starsMap = useTexture('/stars.jpg'); return <mesh><sphereGeometry args={[400, 64, 64]} /><meshBasicMaterial map={starsMap} side={THREE.BackSide} /></mesh>; }
export function Sun() { const sunMap = useTexture('/sun.jpg'); return <mesh position={[200, 20, 100]}><sphereGeometry args={[12, 32, 32]} /><meshBasicMaterial map={sunMap} /></mesh>; }
export function Moon() {
  const moonMap = useTexture('/moon.jpg'); const moonRef = useRef();
  useFrame((state, delta) => { if(!moonRef.current) return; const angle = state.clock.getElapsedTime() * CLOCK_SPEED * 0.05; moonRef.current.position.x = Math.cos(angle) * 30; moonRef.current.position.z = -Math.sin(angle) * 30; moonRef.current.rotation.y += CLOCK_SPEED * 0.01 * delta; });
  return <mesh ref={moonRef}><sphereGeometry args={[0.8, 32, 32]} /><meshStandardMaterial map={moonMap} roughness={0.9} /></mesh>;
}
export function RealEarth({ earthRef }) {
  const [dayMap, nightMap] = useTexture(['/earth_day.jpg', '/earth_night.jpg']);
  const uniforms = useMemo(() => ({ dayTexture: { value: dayMap }, nightTexture: { value: nightMap }, sunDirection: { value: new THREE.Vector3(200, 20, 100).normalize() } }), [dayMap, nightMap]);
  useFrame((state, delta) => { if (earthRef.current) earthRef.current.rotation.y += CLOCK_SPEED * delta; });
  return <mesh ref={earthRef} rotation={[0, Math.PI, 0]}><sphereGeometry args={[1.5, 64, 64]} /><shaderMaterial uniforms={uniforms} vertexShader={`varying vec2 vUv; varying vec3 vWorldNormal; void main() { vUv = uv; vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`} fragmentShader={`uniform sampler2D dayTexture; uniform sampler2D nightTexture; uniform vec3 sunDirection; varying vec2 vUv; varying vec3 vWorldNormal; void main() { vec3 sunDir = normalize(sunDirection); float intensity = dot(vWorldNormal, sunDir); vec3 dayColor = texture2D(dayTexture, vUv).rgb; vec3 nightColor = texture2D(nightTexture, vUv).rgb; float blend = smoothstep(-0.1, 0.1, intensity); vec3 dayLight = dayColor * max(intensity, 0.02); vec3 nightLight = nightColor * (1.0 - blend); gl_FragColor = vec4(dayLight + nightLight, 1.0); }`} /></mesh>;
}