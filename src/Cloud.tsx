import React, { FC, useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from 'react-three-fiber';
import generateVoxelGeometries from './generateVoxelGeometries';
import Shader from './shaders/ToonShaderDotted';
import { Color, Vector3, Group, BufferGeometry, DataTexture } from 'three';
import {
  cloudWhiteColor,
  cloudShadowColor1,
  cloudShadowColor2,
  cloudShadowColor3,
  cloudShadowColor4,
} from './colors';

export type CloudProps = {
  pointLightPosition: Vector3;
  pointLightColor: Color;
  ambientLightColor: Color;
  baseColor?: Color;
  shadeColor1?: Color;
  shadeColor2?: Color;
  shadeColor3?: Color;
  shadeColor4?: Color;
  velocity: Vector3;
  id: string;
  initialPosition: Vector3;
  onExitBoundary: (id: string) => any;
  boundarySize: number;
  size?: number;
  resolution?: number;
};

const white = new Color(cloudWhiteColor);
const shadow1 = new Color(cloudShadowColor1);
const shadow2 = new Color(cloudShadowColor2);
const shadow3 = new Color(cloudShadowColor3);
const shadow4 = new Color(cloudShadowColor4);

type GeometryState = {
  geometry: BufferGeometry;
  resolution: number;
  shadow: DataTexture;
};

export const Cloud: FC<CloudProps> = ({
  pointLightPosition,
  pointLightColor,
  ambientLightColor,
  baseColor = white,
  shadeColor1 = shadow1,
  shadeColor2 = shadow2,
  shadeColor3 = shadow3,
  shadeColor4 = shadow4,
  velocity,
  onExitBoundary,
  id,
  initialPosition,
  size = 248,
  resolution: providedResolution = 64,
}) => {
  const ref = useRef<Group>();
  const rotation = useRef(Math.random() * Math.PI * 2);

  useFrame(() => {
    if (!ref.current) return;

    ref.current.position.add(velocity);
    if (ref.current.position.length() > 1200) {
      onExitBoundary(id);
    }
  });

  const [lodGeometries, setLodGeometries] = useState<
    Map<number, GeometryState>
  >(new Map());

  useEffect(() => {
    const generateLod = (res: number) => {
      generateVoxelGeometries({ resolution: res }).then(
        ({ geometry: geo, shadow }) =>
          setLodGeometries(existing => {
            existing.set(res, {
              resolution: res,
              geometry: geo,
              shadow,
            });
            return new Map(existing);
          }),
      );
    };

    generateLod(providedResolution);
  }, [providedResolution, setLodGeometries]);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        ...Shader.uniforms,
        uDirLightPos: { value: pointLightPosition },
        uDirLightColor: { value: pointLightColor },
        uAmbientLightColor: { value: ambientLightColor },
        uBaseColor: { value: baseColor },
        uLineColor1: { value: shadeColor1 },
        uLineColor2: { value: shadeColor2 },
        uLineColor3: { value: shadeColor3 },
        uLineColor4: { value: shadeColor4 },
      },
      vertexShader: Shader.vertexShader,
      fragmentShader: Shader.fragmentShader,
    }),
    [
      pointLightColor,
      pointLightPosition,
      ambientLightColor,
      baseColor,
      shadeColor1,
      shadeColor2,
    ],
  );

  if (!lodGeometries.size) {
    console.log('Waiting for geometry');
    return null;
  }

  const { geometry, resolution, shadow } = lodGeometries.get(Array.from(
    lodGeometries.keys(),
  )
    .sort()
    .pop() as number) as GeometryState;

  const scale = size / resolution;

  return (
    <>
      <group
        ref={ref}
        position={initialPosition}
        scale={[scale, scale, scale]}
        rotation={[0, rotation.current, 0]}
      >
        <mesh geometry={geometry} position={[0, 2, 0]}>
          <shaderMaterial attach="material" args={[shaderArgs]} />
          {/* <meshPhongMaterial color="#eee" attach="material" /> */}
        </mesh>
        <mesh
          position={[0, 0.5 + Math.random() * 0.01, 0]}
          rotation={[Math.PI * 1.5, 0, 0]}
        >
          <planeBufferGeometry args={[2, 2]} attach="geometry" />
          <meshBasicMaterial
            transparent
            attach="material"
            map={shadow}
            depthTest={true}
            // an alpha value must be at least 15 to be blended.
            // this allows fully transparent portions of overlapping shadows
            // to be ignored (no empty corner cutting into adjacent shadow)
            alphaTest={15.0 / 255.0}
          />
          {/* <meshBasicMaterial color="#ffffff" attach="material" /> */}
        </mesh>
      </group>
    </>
  );
};
