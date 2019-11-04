import { CloudWorkerData, CloudWorkerResult } from './types';
import {
  BufferGeometry,
  BufferAttribute,
  DataTexture,
  RGBAFormat,
  UnsignedByteType,
} from 'three';

function concatenate(a: Float32Array, b: Float32Array, length: number) {
  const result = new Float32Array(a.length + length);
  result.set(a, 0);
  result.set(b.slice(0, length), a.length);
  return result;
}

export default ({ resolution }: { resolution: number }) => {
  const chunkData: CloudWorkerData = {
    resolution,
    inflationPasses: Math.floor(Math.random() * 2 + 2),
  };

  const worker = new Worker('./cubes.worker', {
    name: 'CubeWorker',
    type: 'module',
  });
  return new Promise<{ geometry: BufferGeometry }>((resolve, reject) => {
    worker.addEventListener('message', ev => {
      const data = ev.data as CloudWorkerResult;

      const geometry = new BufferGeometry();
      let positionArray = new Float32Array();
      let normalArray = new Float32Array();
      let colorArray = new Float32Array();
      let uvArray = new Float32Array();

      if (data.hasPositions) {
        positionArray = concatenate(
          positionArray,
          data.positionArray,
          data.count * 3,
        );
        geometry.addAttribute(
          'position',
          new BufferAttribute(positionArray, 3),
        );
      }
      if (data.hasNormals) {
        normalArray = concatenate(
          normalArray,
          data.normalArray,
          data.count * 3,
        );
        geometry.addAttribute('normal', new BufferAttribute(normalArray, 3));
      }
      if (data.hasColors) {
        colorArray = concatenate(colorArray, data.colorArray, data.count * 3);
        geometry.addAttribute('color', new BufferAttribute(colorArray, 3));
      }
      if (data.hasUvs) {
        uvArray = concatenate(uvArray, data.uvArray, data.count * 2);
        geometry.addAttribute('uv', new BufferAttribute(uvArray, 2));
      }

      // this actually screws up our perfectly good normals from
      // generation!
      // geometry.computeVertexNormals();
      // seems to have issues.
      //geometry.computeBoundingSphere();

      resolve({ geometry });
    });

    worker.postMessage(chunkData);
  });
};
