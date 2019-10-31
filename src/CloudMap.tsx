import React, { FC, useState, useEffect } from 'react';
import { CloudProps, Cloud } from './Cloud';
import { Vector3, Color } from 'three';
import { groundColor as groundColorString } from './colors';

const groundColor = new Color(groundColorString);

const numClouds = 4;

const planeSize = 10000;

export type CloudFieldProps = Omit<
  CloudProps,
  'onExitBoundary' | 'id' | 'initialPosition' | 'boundarySize'
> & {
  size?: number;
};

export const CloudMap: FC<CloudFieldProps> = ({ size = 25, ...cloudProps }) => {
  const [clouds, setClouds] = useState<{ [id: string]: CloudData }>({});

  useEffect(() => {
    const initClouds: { [id: string]: CloudData } = {};

    // one cloud always at 0
    const firstId = randomId();
    initClouds[firstId] = {
      id: firstId,
      initialPosition: new Vector3(0, 0, 0),
      size: randomSize(),
    };

    for (let i = 0; i < numClouds; i++) {
      const id = randomId();
      initClouds[id] = {
        id,
        initialPosition: randomPosition(size),
        size: randomSize(),
      };
    }
    setClouds(initClouds);
  }, []);

  const onCloudExitFrame = (id: string) => {
    const newCloud = {
      id: randomId(),
      initialPosition: randomPosition(size),
      size: randomSize(),
    };

    setClouds(c => {
      delete c[id];
      c[newCloud.id] = newCloud;
      return c;
    });
  };

  return (
    <>
      {Object.keys(clouds).map(id => (
        <Cloud
          id={id}
          key={id}
          boundarySize={size}
          initialPosition={clouds[id].initialPosition}
          {...cloudProps}
          onExitBoundary={onCloudExitFrame}
        />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeBufferGeometry args={[planeSize, planeSize]} attach="geometry" />
        <meshBasicMaterial color={groundColor} attach="material" />
      </mesh>
    </>
  );
};

type CloudData = {
  id: string;
  initialPosition: Vector3;
  size: number;
};

const randomId = () => `${Math.random() * 10000000}`;

const randomPosition = (boundarySize: number) =>
  new Vector3(
    Math.random() * boundarySize - boundarySize / 2,
    0,
    Math.random() * boundarySize - boundarySize / 2,
  );

const randomSize = () => Math.random() * 84 + 120;
