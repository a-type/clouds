export type Cube = {
  val: number[];
  points: THREE.Vector3[];
};

export type Triangle = {
  points: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
};

export type CloudWorkerResult = {
  hasPositions: boolean;
  positionArray: Float32Array;
  hasNormals: boolean;
  normalArray: Float32Array;
  hasColors: boolean;
  colorArray: Float32Array;
  hasUvs: boolean;
  uvArray: Float32Array;
  count: number;
  shadowMap: Float32Array;
};

export type CloudWorkerData = {
  resolution: number;
};

export type LandWorkerData = {
  resolution: number;
  noiseSize: number;
  groundColor1: string;
  groundColor2: string;
};

export type LandWorkerResult = {
  textureData: Uint8Array;
};
