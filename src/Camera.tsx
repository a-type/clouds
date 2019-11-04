import React, { FC, useRef, useEffect } from 'react';
import { useThree, useFrame, extend } from 'react-three-fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vector3 } from 'three';
extend({ OrbitControls });

const ExtendedOrbitControls = 'orbitControls' as any;

export type CameraProps = {
  position: number[];
  controlled?: boolean;
};

export const Camera: FC<CameraProps> = ({ position, controlled = false }) => {
  const camera = useRef<any>();
  const controls = useRef<any>();
  const { size, setDefaultCamera } = useThree();
  useEffect(() => void setDefaultCamera(camera.current), [setDefaultCamera]);
  useFrame(() => {
    if (controls.current) controls.current.update();
    if (camera.current) camera.current.updateMatrixWorld();
  });

  return (
    <>
      <perspectiveCamera
        ref={camera}
        aspect={size.width / size.height}
        fov={55}
        position={position}
        onUpdate={self => {
          self.updateProjectionMatrix();
          self.lookAt(new Vector3(0, 0, 0));
        }}
      />
      {controlled && camera.current && (
        <ExtendedOrbitControls
          ref={controls}
          args={[camera.current]}
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={1}
        />
      )}
    </>
  );
};
