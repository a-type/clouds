export type Cube = {
  val: number[];
  points: THREE.Vector3[];
};

export type Triangle = {
  points: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
};

export type GeometryData = {
  hasPositions: boolean;
  positionArray: Float32Array;
  hasNormals: boolean;
  normalArray: Float32Array;
  hasColors: boolean;
  colorArray: Float32Array;
  hasUvs: boolean;
  uvArray: Float32Array;
  count: number;
};

export type WorkerData = {};
