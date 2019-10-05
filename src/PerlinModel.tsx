import React, { FC, useRef, useEffect, useState } from 'react';
import { useFrame } from 'react-three-fiber';
import * as THREE from 'three';
import generateVoxelGeometries from './generateVoxelGeometries';

export type PerlinProps = {};

export const PerlinModel: FC<PerlinProps> = ({}) => {
  const ref = useRef({
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
  });

  useFrame(() => (ref.current.rotation.y += 0.01));

  const [geometries, setGeometries] = useState<THREE.Geometry[] | null>(null);
  useEffect(() => {
    generateVoxelGeometries().then(geos => setGeometries(geos));
  }, []);

  if (!geometries) {
    console.log('Waiting for geometry');
    return null;
  }

  console.log(`Rendering geometry:`, geometries.length);

  return (
    <>
      {geometries.map((geo, idx) => (
        <mesh
          key={idx}
          ref={ref}
          onClick={e => console.log('click')}
          onPointerOver={e => console.log('hover')}
          onPointerOut={e => console.log('unhover')}
          geometry={geo}
        >
          <meshBasicMaterial
            attach="material"
            color="white"
            opacity={0.5}
            transparent
          />
        </mesh>
      ))}
    </>
  );
};
