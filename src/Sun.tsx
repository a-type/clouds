import React, { FC } from 'react';
import { Vector3, Color, Euler } from 'three';

export type SunProps = {
  position: Vector3;
  color: Color;
};

export const Sun: FC<SunProps> = ({ position, color }) => {
  return (
    <directionalLight
      position={position}
      color={color}
      intensity={1}
      {...({ shadowCameraVisible: true, shadowDarkness: 1 } as any)}
    />
  );
};
