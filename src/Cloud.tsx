import React, { FC, useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from 'react-three-fiber';
import * as THREE from 'three';
import generateVoxelGeometries from './generateVoxelGeometries';
import ToonShaderDotted from './shaders/ToonShaderDotted';
import { Color, Vector3, Frustum, Matrix4, Mesh, Group } from 'three';
import { cloudWhiteColor, cloudShadowColor } from './colors';

export type CloudProps = {
  pointLightPosition: Vector3;
  pointLightColor: Color;
  ambientLightColor: Color;
  baseColor?: Color;
  shadeColor?: Color;
  velocity: Vector3;
  id: string;
  initialPosition: Vector3;
  onExitBoundary: (id: string) => any;
  boundarySize: number;
};

const white = new Color(cloudWhiteColor);
const black = new Color(cloudShadowColor);

export const Cloud: FC<CloudProps> = ({
  pointLightPosition,
  pointLightColor,
  ambientLightColor,
  baseColor = white,
  shadeColor = black,
  velocity,
  onExitBoundary,
  id,
  initialPosition,
}) => {
  const ref = useRef<Group>();

  useFrame(() => {
    if (!ref.current) return;

    ref.current.position.add(velocity);
    if (ref.current.position.length() > 1200) {
      onExitBoundary(id);
    }
  });

  const [geometry, setGeometries] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    generateVoxelGeometries().then(geo => setGeometries(geo));
  }, []);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        ...ToonShaderDotted.uniforms,
        uDirLightPos: { value: pointLightPosition },
        uDirLightColor: { value: pointLightColor },
        uAmbientLightColor: { value: ambientLightColor },
        uBaseColor: { value: baseColor },
        uLineColor1: { value: shadeColor },
      },
      vertexShader: ToonShaderDotted.vertexShader,
      fragmentShader: ToonShaderDotted.fragmentShader,
    }),
    [
      pointLightColor,
      pointLightPosition,
      ambientLightColor,
      baseColor,
      shadeColor,
    ],
  );

  if (!geometry) {
    console.log('Waiting for geometry');
    return null;
  }

  return (
    <>
      <group ref={ref} position={initialPosition}>
        <mesh geometry={geometry} scale={[8, 8, 8]}>
          <shaderMaterial attach="material" args={[shaderArgs]} />
          {/* <meshPhongMaterial color="#eee" attach="material" /> */}
        </mesh>
        <mesh geometry={geometry} scale={[8, 0, 8]} position={[0, -9, 0]}>
          <meshBasicMaterial
            transparent
            opacity={0.1}
            color="black"
            attach="material"
          />
        </mesh>
      </group>
    </>
  );
};
