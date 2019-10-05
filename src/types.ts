export type Cube = {
  val: number[];
  points: THREE.Vector3[];
};

export type Triangle = {
  points: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
};

export type ChunkData = {
  verts: THREE.Vector3[][][][];
  faces: THREE.Face3[][][][];
  chunkX: number;
  chunkY: number;
  chunkZ: number;
};

export type WorkerData = {
  size: number;
  stepSize: number;
  chunkSize: number;
  chunkCoordinate: [number, number, number];
  voxelData: number[][][];
  batchSize: [number, number, number];
};
