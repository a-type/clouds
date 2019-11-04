import React, { FC, useRef } from 'react';
import {
  Vector3,
  Color,
  Euler,
  DirectionalLightShadow,
  OrthographicCamera,
  Vector2,
} from 'three';

export type SunProps = {
  position: Vector3;
  color: Color;
};

const shadow = new DirectionalLightShadow(
  new OrthographicCamera(-50, 50, -50, 50, 0.5, 1000),
);
shadow.camera.left = -100;
shadow.camera.right = 100;
shadow.camera.top = 100;
shadow.camera.bottom = -100;
shadow.camera.far = 1000;
shadow.mapSize = new Vector2(1024, 1024);
shadow.radius = 2;
shadow.bias = 0.5;

export const Sun: FC<SunProps> = ({ position, color }) => {
  const targetRef = useRef();

  return (
    <>
      <directionalLight
        position={position}
        color={color}
        intensity={0.2}
        castShadow
        target={targetRef.current}
        shadow={shadow}
      />
      <mesh position={new Vector3(0, 0, 0)} ref={targetRef} />
    </>
  );
};
