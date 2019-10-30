import React, { FC, useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import generateVoxelGeometries from './generateVoxelGeometries';
import ToonShaderDotted from './shaders/ToonShaderDotted';
import { Color, Vector3 } from 'three';

export type PerlinProps = {
  pointLightPosition: Vector3;
  pointLightColor: Color;
  ambientLightColor: Color;
  baseColor?: Color;
  shadeColor?: Color;
};

const white = new Color(0xffffff);
const black = new Color(0x000000);

export const PerlinModel: FC<PerlinProps> = ({
  pointLightPosition,
  pointLightColor,
  ambientLightColor,
  baseColor = white,
  shadeColor = black,
}) => {
  const ref = useRef({
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
  });

  useFrame(() => (ref.current.rotation.y += 0.001));

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

  console.log(`Rendering geometry:`, geometry);

  return (
    <>
      <mesh
        ref={ref}
        onClick={e => console.log('click')}
        onPointerOver={e => console.log('hover')}
        onPointerOut={e => console.log('unhover')}
        geometry={geometry}
        scale={[2, 2, 2]}
      >
        <shaderMaterial attach="material" args={[shaderArgs]} />
      </mesh>
    </>
  );
};

// var dottedMaterial = createShaderMaterial( ToonShaderDotted, light, ambientLight );
// const dotted = {
//   m: dottedMaterial,
//   h: 0.2, s: 1, l: 0.9
// }

// function createShaderMaterial( shader: typeof ToonShaderDotted, light, ambientLight ) {
//   var u = THREE.UniformsUtils.clone( shader.uniforms );
//   var vs = shader.vertexShader;
//   var fs = shader.fragmentShader;
//   var material = new THREE.ShaderMaterial( { uniforms: u, vertexShader: vs, fragmentShader: fs } );
//   material.uniforms[ "uDirLightPos" ].value = light.position;
//   material.uniforms[ "uDirLightColor" ].value = light.color;
//   material.uniforms[ "uAmbientLightColor" ].value = ambientLight.color;
//   return material;
// }
