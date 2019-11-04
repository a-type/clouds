import { LandWorkerData, LandWorkerResult } from './types';
import { groundColor1, groundColor2 } from './colors';
import {
  DataTexture,
  RGBFormat,
  UnsignedByteType,
  RepeatWrapping,
} from 'three';

export default ({ resolution }: { resolution: number }) => {
  const data: LandWorkerData = {
    resolution,
    noiseSize: 32,
    groundColor1,
    groundColor2,
  };

  const worker = new Worker('./land.worker', {
    name: 'LandWorker',
    type: 'module',
  });
  return new Promise<{ texture: DataTexture }>((resolve, reject) => {
    worker.addEventListener('message', ev => {
      const result = ev.data as LandWorkerResult;

      const texture = new DataTexture(
        result.textureData,
        resolution,
        resolution,
        RGBFormat,
        UnsignedByteType,
      );

      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;

      resolve({ texture });
    });

    worker.postMessage(data);
  });
};
