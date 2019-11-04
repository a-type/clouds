import React, { FC, useMemo } from 'react';
import { useLoader, useUpdate } from 'react-three-fiber';
import { FontLoader, Vector3, Mesh } from 'three';
import { CloudShaderMaterial } from './CloudShaderMaterial';

export type TextProps = {
  children: string;
  size?: number;
};

export const Text: FC<TextProps> = ({ children, size = 1 }) => {
  const font = useLoader(FontLoader as any, '/fonts/Roboto Light_Regular.json');
  const config = useMemo(
    () => ({
      font,
      size: 40,
      height: 10,
      curveSegments: 32,
    }),
    [font],
  );
  const mesh = useUpdate(
    (self: Mesh) => {
      const size = new Vector3();
      self.geometry.computeBoundingBox();
      self.geometry.boundingBox.getSize(size);
      self.position.x = -size.x / 2;
      self.position.y = -size.y / 2;
    },
    [children],
  );

  return (
    <group
      scale={[0.1 * size, 0.1 * size, 0.1]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <mesh ref={mesh} receiveShadow>
        <textGeometry
          attach="geometry"
          args={[children, config] as [string, any]}
        />
        <CloudShaderMaterial attach="material" />
      </mesh>
    </group>
  );
};
