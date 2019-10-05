import * as THREE from 'three';
import values from './cubesValues';
import { Cube, Triangle, ChunkData, WorkerData } from './types';

const context = self; // eslint-disable-line no-restricted-globals

const isoLevel = 0.01;

const interpolateVertices = (
  v1: THREE.Vector3,
  v2: THREE.Vector3,
  val1: number,
  val2: number,
) => {
  const epsilon = 0.00001;
  if (Math.abs(isoLevel - val1) < epsilon) {
    return v1; // suitably close to v1
  } else if (Math.abs(isoLevel - val2) < epsilon) {
    return v2; // suitably close to v2
  } else if (Math.abs(val1 - val2) < epsilon) {
    return v1; // suitably close together
  }

  const mu = (isoLevel - val1) / (val2 - val1);
  return new THREE.Vector3(
    v1.x + mu * (v2.x - v1.x),
    v1.y + mu * (v2.y - v1.y),
    v1.z + mu * (v2.z - v1.z),
  );
};

const processCube = (cube: Cube) => {
  if (!cube) return [];

  let cubeIndex = 0;
  const vertList: THREE.Vector3[] = [];
  let i = 0;
  let nTriangle = 0;
  // sparse array, hence the size counter above
  const triangles: Triangle[] = [];

  for (i = 0; i < 8; i++) {
    if (cube.val[i] < isoLevel) {
      cubeIndex |= 1 << i;
    }
  }

  // cube is enclosed or excluded from the surface
  if (values.edges[cubeIndex] === 0) {
    return triangles;
  }

  // find surface intersections with cube
  const indexSequence = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  for (i = 0; i < indexSequence.length; i++) {
    if (values.edges[cubeIndex] & Math.pow(2, i)) {
      const [a, b] = indexSequence[i];
      vertList[i] = interpolateVertices(
        cube.points[a],
        cube.points[b],
        cube.val[a],
        cube.val[b],
      );
    }
  }

  for (i = 0; values.tris[cubeIndex][i] !== -1; i += 3) {
    triangles[nTriangle] = {
      points: [
        vertList[values.tris[cubeIndex][i]],
        vertList[values.tris[cubeIndex][i + 1]],
        vertList[values.tris[cubeIndex][i + 2]],
      ],
    };
    nTriangle++;
  }

  return triangles;
};

const getCubes = (
  size: number,
  stepSize: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
  voxelData: number[][][],
): Cube[][][] => {
  console.debug(minX, maxX, minY, maxY, minZ, maxZ);
  let cubes: Cube[][][] = [];
  const halfSize = size / 2;
  // positional vars
  let x = 0;
  let y = 0;
  let z = 0;
  // temp index vars
  let ix = 0;
  let iy = 0;
  let iz = 0;
  // absolute indexes into voxel array
  let ax = 0;
  let ay = 0;
  let az = 0;

  for (ix = 0; ix < maxX - minX - 1; ix++) {
    ax = ix + minX;
    x = ax * stepSize - halfSize;
    cubes[ix] = [];
    for (iy = 0; iy < maxY - minY - 1; iy++) {
      ay = iy + minY;
      y = ay * stepSize - halfSize;
      cubes[ix][iy] = [];
      for (iz = 0; iz < maxZ - minZ - 1; iz++) {
        az = iz + minZ;
        z = az * stepSize - halfSize;
        try {
          cubes[ix][iy][iz] = {
            val: [
              voxelData[ax][ay][az],
              voxelData[ax][ay + 1][az],
              voxelData[ax + 1][ay + 1][az],
              voxelData[ax + 1][ay][az],
              voxelData[ax][ay][az + 1],
              voxelData[ax][ay + 1][az + 1],
              voxelData[ax + 1][ay + 1][az + 1],
              voxelData[ax + 1][ay][az + 1],
            ],
            points: [
              new THREE.Vector3(x, y, z),
              new THREE.Vector3(x, y + stepSize, z),
              new THREE.Vector3(x + stepSize, y + stepSize, z),
              new THREE.Vector3(x + stepSize, y, z),
              new THREE.Vector3(x, y, z + stepSize),
              new THREE.Vector3(x, y + stepSize, z + stepSize),
              new THREE.Vector3(x + stepSize, y + stepSize, z + stepSize),
              new THREE.Vector3(x + stepSize, y, z + stepSize),
            ],
          };
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  return cubes;
};

const createChunk = ({
  size,
  stepSize,
  chunkSize,
  chunkCoordinate: [chunkX, chunkY, chunkZ],
  voxelData,
  batchSize: [batchSizeX, batchSizeY, batchSizeZ],
}: WorkerData) => {
  const returnData: ChunkData = {
    verts: [],
    faces: [],
    chunkX,
    chunkY,
    chunkZ,
  };

  const cubes = getCubes(
    size,
    stepSize,
    chunkX,
    chunkX + chunkSize * batchSizeX,
    chunkY,
    chunkY + chunkSize * batchSizeY,
    chunkZ,
    chunkZ + chunkSize * batchSizeZ,
    voxelData,
  );

  let x = 0;
  let y = 0;
  let z = 0;
  let bx = 0;
  let by = 0;
  let bz = 0;
  let triIdx = 0;
  let t = 0;
  let tv = 0;

  for (bx = 0; bx < batchSizeX - 1; bx++) {
    returnData.verts[bx] = [];
    returnData.faces[bx] = [];
    for (by = 0; by < batchSizeY - 1; by++) {
      returnData.verts[bx][by] = [];
      returnData.faces[bx][by] = [];
      for (bz = 0; bz < batchSizeZ - 1; bz++) {
        returnData.verts[bx][by][bz] = [];
        returnData.faces[bx][by][bz] = [];
        triIdx = 0;
        for (x = 0; x < chunkSize; x++) {
          for (y = 0; y < chunkSize; y++) {
            for (z = 0; z < chunkSize; z++) {
              try {
                const cube =
                  cubes[x + bx * chunkSize][y + by * chunkSize][
                    z + bz * chunkSize
                  ];
                const triangles = processCube(cube);
                for (t = 0; t < triangles.length; t++) {
                  for (tv = 0; tv < 3; tv++) {
                    returnData.verts[bx][by][bz].push(
                      triangles[t].points[tv].clone(),
                    );
                  }
                  returnData.faces[bx][by][bz].push(
                    new THREE.Face3(triIdx, triIdx + 1, triIdx + 2),
                  );
                  triIdx += 3;
                }
              } catch (err) {
                console.error(
                  `No cube: [${x}, ${y}, ${z}], b: [${bx}, ${by}, ${bz}], chunkSize: ${chunkSize}`,
                );
              }
            }
          }
        }
      }
    }
  }

  context.postMessage(returnData);
};

context.addEventListener('message', function(ev) {
  console.log('Worker started');
  createChunk(ev.data);
});
