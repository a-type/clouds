import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';

export default function Thing() {
  const ref = useRef({
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
  });

  useFrame(() => (ref.current.rotation.y += 0.001));

  return (
    <mesh
      ref={ref}
      onClick={e => console.log('click')}
      onPointerOver={e => console.log('hover')}
      onPointerOut={e => console.log('unhover')}
    >
      <sphereBufferGeometry attach="geometry" args={[1, 16, 16]} />
      <meshBasicMaterial
        attach="material"
        color="hotpink"
        opacity={0.5}
        transparent
      />
    </mesh>
  );
}
