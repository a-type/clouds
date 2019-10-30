import { WorkerData, GeometryData } from './types';
import * as THREE from 'three';

const size = 64;
const stepSize = 1;
const chunkSize = 8;
const batchSize = 4;

function concatenate(a: Float32Array, b: Float32Array, length: number) {
  const result = new Float32Array(a.length + length);
  result.set(a, 0);
  result.set(b.slice(0, length), a.length);
  return result;
}

export default () => {
  const chunkData: WorkerData = {};

  const worker = new Worker('./cubes.worker', { type: 'module' });
  return new Promise<THREE.BufferGeometry>((resolve, reject) => {
    worker.addEventListener('message', ev => {
      const data = ev.data as GeometryData;
      console.debug(data);

      const geometry = new THREE.BufferGeometry();
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
          new THREE.BufferAttribute(positionArray, 3),
        );
      }
      if (data.hasNormals) {
        normalArray = concatenate(
          normalArray,
          data.normalArray,
          data.count * 3,
        );
        geometry.addAttribute(
          'normal',
          new THREE.BufferAttribute(normalArray, 3),
        );
      }
      if (data.hasColors) {
        colorArray = concatenate(colorArray, data.colorArray, data.count * 3);
        geometry.addAttribute(
          'color',
          new THREE.BufferAttribute(colorArray, 3),
        );
      }
      if (data.hasUvs) {
        uvArray = concatenate(uvArray, data.uvArray, data.count * 2);
        geometry.addAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
      }

      resolve(geometry);
    });

    worker.postMessage(chunkData);
  });
};
