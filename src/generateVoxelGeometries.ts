import { WorkerData, ChunkData } from './types';
import * as THREE from 'three';
import { perlin3 } from './perlin';

const voxels: number[][][] = [];

const density = (
  [px, py, pz]: [number, number, number],
  size: number,
  stepSize: number,
) => {
  const m = stepSize / (size / 2);
  const x = px * m;
  const y = py * m;
  const z = pz * m;
  return perlin3(x * 2 + 5, y * 2 + 3, z * 2 + 0.5);
};

const generate = (size: number, stepSize: number) => {
  let px = 0;
  let py = 0;
  let pz = 0;

  for (px = 0; px < size; px++) {
    voxels[px] = [];
    for (py = 0; py < size; py++) {
      voxels[px][py] = [];
      for (pz = 0; pz < size; pz++) {
        voxels[px][py][pz] = density([px, py, pz], size, stepSize);
      }
    }
  }

  return voxels;
};

const size = 64;
const stepSize = 1;
const chunkSize = 8;
const batchSize = 4;

/**
 * Utilizes threaded workers to asynchronously create voxel geometries
 */
export default async () => {
  let chunkX = 0;
  let chunkY = 0;
  let chunkZ = 0;

  const promises: Promise<THREE.Geometry>[] = [];
  for (chunkX = 0; chunkX < size; chunkX += chunkSize * batchSize) {
    for (chunkY = 0; chunkY < size; chunkY += chunkSize * batchSize) {
      for (chunkZ = 0; chunkZ < size; chunkZ += chunkSize * batchSize) {
        promises.push(buildChunk([chunkX, chunkY, chunkZ], batchSize));
      }
    }
  }

  const geometries = await Promise.all(promises);
  return geometries;
};

const buildChunk = (
  coordinate: [number, number, number],
  batchSize: number,
) => {
  const chunkData: WorkerData = {
    size,
    stepSize,
    chunkSize,
    chunkCoordinate: coordinate,
    voxelData: generate(size, stepSize),
    batchSize: [batchSize, batchSize, batchSize],
  };

  const chunkWorker = new Worker('./cubes.worker', { type: 'module' });
  return new Promise<THREE.Geometry>((resolve, reject) => {
    chunkWorker.addEventListener('message', ev => {
      const data = ev.data as ChunkData;

      let bx = 0;
      let by = 0;
      let bz = 0;

      for (bx = 0; bx < data.verts.length; bx++) {
        for (by = 0; by < data.verts[bx].length; by++) {
          for (bz = 0; bz < data.verts[bx][by].length; bz++) {
            let chunkX = data.chunkX / chunkSize + bx;
            let chunkY = data.chunkY / chunkSize + by;
            let chunkZ = data.chunkZ / chunkSize + bz;
            let i = 0;
            const geometry = new THREE.Geometry();
            let vert: THREE.Vector3;
            let face: THREE.Face3;

            for (i = 0; i < data.verts[bx][by][bz].length; i++) {
              vert = data.verts[bx][by][bz][i];
              geometry.vertices.push(new THREE.Vector3(vert.x, vert.y, vert.z));
            }
            for (i = 0; i < data.faces[bx][by][bz].length; i++) {
              face = data.faces[bx][by][bz][i];
              geometry.faces.push(new THREE.Face3(face.a, face.b, face.c));
            }

            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            resolve(geometry);
          }
        }
      }
    });

    chunkWorker.postMessage(chunkData);
  });
};
