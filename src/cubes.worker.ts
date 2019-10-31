import cubesValues from './cubesValues';
import { WorkerData, GeometryData } from './types';
import cloudInflator from './cloudInflator';
import { getValue } from './voxelField';

// Essentially copied from https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/MarchingCubes.js
// with alterations for brevity and readability (why do graphics programmers always use
// completely incomprehensible variable names?)

const context = self; // eslint-disable-line no-restricted-globals

context.addEventListener('message', function(ev) {
  console.log('Worker started');
  const data: WorkerData = ev.data;

  // temp buffers used to polygonize
  const vertexList = new Float32Array(12 * 3);
  const normalList = new Float32Array(12 * 3);
  const colorList = new Float32Array(12 * 3);

  const enableUvs = false;
  const enableColors = false;

  const size = data.resolution;
  const size2 = size * size;
  const size3 = size2 * size;
  const halfSize = size / 2.0;

  // deltas
  const delta = 2.0 / size;
  const yDelta = size;
  const zDelta = size2;

  const field = new Float32Array(size3); // voxels
  const normalCache = new Float32Array(size3 * 3); // vectors
  const palette = new Float32Array(size3 * 3); // colors

  const maxCount = size3 * 3;
  let count = 0;

  let flatShading = false;
  let isolation = 0.03;

  const uvMap = null; // unsure of how to do this

  const positionArray = new Float32Array(maxCount * 3);
  const normalArray = new Float32Array(maxCount * 3);

  const uvArray = new Float32Array(maxCount * 2);
  const colorArray = new Float32Array(maxCount * 3);

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function vertexInterpolateX(
    q: number,
    offset: number,
    isol: number,
    x: number,
    y: number,
    z: number,
    valp1: number,
    valp2: number,
    colorOffset1: number,
    colorOffset2: number,
  ) {
    const mu = (isol - valp1) / (valp2 - valp1);

    vertexList[offset + 0] = x + mu * delta;
    vertexList[offset + 1] = y;
    vertexList[offset + 2] = z;

    normalList[offset + 0] = lerp(normalCache[q + 0], normalCache[q + 3], mu);
    normalList[offset + 1] = lerp(normalCache[q + 1], normalCache[q + 4], mu);
    normalList[offset + 2] = lerp(normalCache[q + 2], normalCache[q + 5], mu);

    colorList[offset + 0] = lerp(
      palette[colorOffset1 * 3 + 0],
      palette[colorOffset2 * 3 + 0],
      mu,
    );
    colorList[offset + 1] = lerp(
      palette[colorOffset1 * 3 + 1],
      palette[colorOffset2 * 3 + 1],
      mu,
    );
    colorList[offset + 2] = lerp(
      palette[colorOffset1 * 3 + 2],
      palette[colorOffset2 * 3 + 2],
      mu,
    );
  }

  function vertexInterpolateY(
    q: number,
    offset: number,
    isol: number,
    x: number,
    y: number,
    z: number,
    valp1: number,
    valp2: number,
    colorOffset1: number,
    colorOffset2: number,
  ) {
    const mu = (isol - valp1) / (valp2 - valp1);

    vertexList[offset + 0] = x;
    vertexList[offset + 1] = y + mu * delta;
    vertexList[offset + 2] = z;

    const q2 = q + yDelta * 3;

    normalList[offset + 0] = lerp(normalCache[q + 0], normalCache[q2 + 0], mu);
    normalList[offset + 1] = lerp(normalCache[q + 1], normalCache[q2 + 1], mu);
    normalList[offset + 2] = lerp(normalCache[q + 2], normalCache[q2 + 2], mu);

    colorList[offset + 0] = lerp(
      palette[colorOffset1 * 3 + 0],
      palette[colorOffset2 * 3 + 0],
      mu,
    );
    colorList[offset + 1] = lerp(
      palette[colorOffset1 * 3 + 1],
      palette[colorOffset2 * 3 + 1],
      mu,
    );
    colorList[offset + 2] = lerp(
      palette[colorOffset1 * 3 + 2],
      palette[colorOffset2 * 3 + 2],
      mu,
    );
  }

  function vertexInterpolateZ(
    q: number,
    offset: number,
    isol: number,
    x: number,
    y: number,
    z: number,
    valp1: number,
    valp2: number,
    colorOffset1: number,
    colorOffset2: number,
  ) {
    const mu = (isol - valp1) / (valp2 - valp1);

    vertexList[offset + 0] = x;
    vertexList[offset + 1] = y;
    vertexList[offset + 2] = z + mu * delta;

    const q2 = q + zDelta * 3;

    normalList[offset + 0] = lerp(normalCache[q + 0], normalCache[q2 + 0], mu);
    normalList[offset + 1] = lerp(normalCache[q + 1], normalCache[q2 + 1], mu);
    normalList[offset + 2] = lerp(normalCache[q + 2], normalCache[q2 + 2], mu);

    colorList[offset + 0] = lerp(
      palette[colorOffset1 * 3 + 0],
      palette[colorOffset2 * 3 + 0],
      mu,
    );
    colorList[offset + 1] = lerp(
      palette[colorOffset1 * 3 + 1],
      palette[colorOffset2 * 3 + 1],
      mu,
    );
    colorList[offset + 2] = lerp(
      palette[colorOffset1 * 3 + 2],
      palette[colorOffset2 * 3 + 2],
      mu,
    );
  }

  function computeNormal(q: number) {
    const q3 = q * 3;
    if (normalCache[q3] === 0.0) {
      normalCache[q3 + 0] = field[q - 1] - field[q + 1];
      normalCache[q3 + 1] = field[q - yDelta] - field[q + yDelta];
      normalCache[q3 + 2] = field[q - zDelta] - field[q + zDelta];
    }
  }

  /**
   * @returns number of triangles
   */
  function polygonize(
    fx: number,
    fy: number,
    fz: number,
    q: number,
    isol: number,
  ) {
    // cache indices
    let q1 = q + 1,
      qy = q + yDelta,
      qz = q + zDelta,
      q1y = q1 + yDelta,
      q1z = q1 + zDelta,
      qyz = q + yDelta + zDelta,
      q1yz = q1 + yDelta + zDelta;

    let cubeIndex = 0,
      field0 = field[q],
      field1 = field[q1],
      field2 = field[qy],
      field3 = field[q1y],
      field4 = field[qz],
      field5 = field[q1z],
      field6 = field[qyz],
      field7 = field[q1yz];

    if (field0 < isol) cubeIndex |= 1;
    if (field1 < isol) cubeIndex |= 2;
    if (field2 < isol) cubeIndex |= 8;
    if (field3 < isol) cubeIndex |= 4;
    if (field4 < isol) cubeIndex |= 16;
    if (field5 < isol) cubeIndex |= 32;
    if (field6 < isol) cubeIndex |= 128;
    if (field7 < isol) cubeIndex |= 64;

    const bits = cubesValues.edgeTable[cubeIndex];

    // cube is entirely included or excluded; no vertices to render
    if (bits === 0) return 0;

    let fx2 = fx + delta,
      fy2 = fy + delta,
      fz2 = fz + delta;

    // top of the cube
    if (bits & 1) {
      computeNormal(q);
      computeNormal(q1);
      vertexInterpolateX(q * 3, 0, isol, fx, fy, fz, field0, field1, q, q1);
    }

    if (bits & 2) {
      computeNormal(q1);
      computeNormal(q1y);
      vertexInterpolateY(q1 * 3, 3, isol, fx2, fy, fz, field1, field3, q1, q1y);
    }

    if (bits & 4) {
      computeNormal(qy);
      computeNormal(q1y);
      vertexInterpolateX(qy * 3, 6, isol, fx, fy2, fz, field2, field3, qy, q1y);
    }

    if (bits & 8) {
      computeNormal(q);
      computeNormal(qy);
      vertexInterpolateY(q * 3, 9, isol, fx, fy, fz, field0, field2, q, qy);
    }

    // bottom of the cube
    if (bits & 16) {
      computeNormal(qz);
      computeNormal(q1z);
      vertexInterpolateX(
        qz * 3,
        12,
        isol,
        fx,
        fy,
        fz2,
        field4,
        field5,
        qz,
        q1z,
      );
    }

    if (bits & 32) {
      computeNormal(q1z);
      computeNormal(q1yz);
      vertexInterpolateY(
        q1z * 3,
        15,
        isol,
        fx2,
        fy,
        fz2,
        field5,
        field7,
        q1z,
        q1yz,
      );
    }

    if (bits & 64) {
      computeNormal(qyz);
      computeNormal(q1yz);
      vertexInterpolateX(
        qyz * 3,
        18,
        isol,
        fx,
        fy2,
        fz2,
        field6,
        field7,
        qyz,
        q1yz,
      );
    }

    if (bits & 128) {
      computeNormal(qz);
      computeNormal(qyz);
      vertexInterpolateY(
        qz * 3,
        21,
        isol,
        fx,
        fy,
        fz2,
        field4,
        field6,
        qz,
        qyz,
      );
    }

    // vertical lines of the cube
    if (bits & 256) {
      computeNormal(q);
      computeNormal(qz);
      vertexInterpolateZ(q * 3, 24, isol, fx, fy, fz, field0, field4, q, qz);
    }
    if (bits & 512) {
      computeNormal(q1);
      computeNormal(q1z);
      vertexInterpolateZ(
        q1 * 3,
        27,
        isol,
        fx2,
        fy,
        fz,
        field1,
        field5,
        q1,
        q1z,
      );
    }
    if (bits & 1024) {
      computeNormal(q1y);
      computeNormal(q1yz);
      vertexInterpolateZ(
        q1y * 3,
        30,
        isol,
        fx2,
        fy2,
        fz,
        field3,
        field7,
        q1y,
        q1yz,
      );
    }
    if (bits & 2048) {
      computeNormal(qy);
      computeNormal(qyz);
      vertexInterpolateZ(
        qy * 3,
        33,
        isol,
        fx,
        fy2,
        fz,
        field2,
        field6,
        qy,
        qyz,
      );
    }

    cubeIndex <<= 4; // re-purpose cube index into an offset into triangle table

    let o1,
      o2,
      o3,
      numTris = 0,
      i = 0;

    while (cubesValues.triTable[cubeIndex + i] !== -1) {
      o1 = cubeIndex + i;
      o2 = o1 + 1;
      o3 = o1 + 2;

      posnormtriv(
        vertexList,
        normalList,
        colorList,
        3 * cubesValues.triTable[o1],
        3 * cubesValues.triTable[o2],
        3 * cubesValues.triTable[o3],
      );

      i += 3;
      numTris++;
    }

    return numTris;
  }

  function posnormtriv(
    pos: Float32Array,
    norm: Float32Array,
    colors: Float32Array,
    o1: number,
    o2: number,
    o3: number,
  ) {
    const c = count * 3;

    // positions
    positionArray[c + 0] = pos[o1 + 0];
    positionArray[c + 1] = pos[o1 + 1];
    positionArray[c + 2] = pos[o1 + 2];
    positionArray[c + 3] = pos[o2 + 0];
    positionArray[c + 4] = pos[o2 + 1];
    positionArray[c + 5] = pos[o2 + 2];
    positionArray[c + 6] = pos[o3 + 0];
    positionArray[c + 7] = pos[o3 + 1];
    positionArray[c + 8] = pos[o3 + 2];

    // normals
    if (flatShading) {
      const nx = (norm[o1 + 0] + norm[o2 + 0] + norm[o3 + 0]) / 3;
      const ny = (norm[o1 + 1] + norm[o2 + 1] + norm[o3 + 1]) / 3;
      const nz = (norm[o1 + 2] + norm[o2 + 2] + norm[o3 + 2]) / 3;

      normalArray[c + 0] = nx;
      normalArray[c + 1] = ny;
      normalArray[c + 2] = nz;
      normalArray[c + 3] = nx;
      normalArray[c + 4] = ny;
      normalArray[c + 5] = nz;
      normalArray[c + 6] = nx;
      normalArray[c + 7] = ny;
      normalArray[c + 8] = nz;
    } else {
      normalArray[c + 0] = norm[o1 + 0];
      normalArray[c + 1] = norm[o1 + 1];
      normalArray[c + 2] = norm[o1 + 2];
      normalArray[c + 3] = norm[o2 + 0];
      normalArray[c + 4] = norm[o2 + 1];
      normalArray[c + 5] = norm[o2 + 2];
      normalArray[c + 6] = norm[o3 + 0];
      normalArray[c + 7] = norm[o3 + 1];
      normalArray[c + 8] = norm[o3 + 2];
    }

    // uvs
    if (enableUvs) {
      const d = count * 2;
      uvArray[d + 0] = pos[o1 + 0];
      uvArray[d + 1] = pos[o1 + 2];
      uvArray[d + 2] = pos[o2 + 0];
      uvArray[d + 3] = pos[o2 + 2];
      uvArray[d + 4] = pos[o3 + 0];
      uvArray[d + 5] = pos[o3 + 2];
    }

    // colors
    if (enableColors) {
      colorArray[c + 0] = colors[o1 + 0];
      colorArray[c + 1] = colors[o1 + 1];
      colorArray[c + 2] = colors[o1 + 2];
      colorArray[c + 3] = colors[o2 + 0];
      colorArray[c + 4] = colors[o2 + 1];
      colorArray[c + 5] = colors[o2 + 2];
      colorArray[c + 6] = colors[o3 + 0];
      colorArray[c + 7] = colors[o3 + 1];
      colorArray[c + 8] = colors[o3 + 2];
    }

    count += 3;
  }

  function blur(intensity: number = 1) {
    const fieldCopy = field.slice();
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const index = size2 * z + size * y + x;
          let val = fieldCopy[index];
          let c = 1;

          for (let x2 = -1; x2 <= 1; x2 += 2) {
            const x3 = x2 + x;
            if (x3 < 0 || x3 >= size) continue;

            for (let y2 = -1; y2 <= 1; y2 += 2) {
              const y3 = y2 + y;
              if (y3 < 0 || y3 >= size) continue;

              for (let z2 = -1; z2 <= 1; z2 += 2) {
                const z3 = z2 + z;
                if (z3 < 0 || z3 >= size) continue;

                const index2 = size2 * z3 + size * y3 + x3;
                const val2 = fieldCopy[index2];

                c++;
                val += (intensity * (val2 - val)) / c;
              }
            }
          }

          field[index] = val;
        }
      }
    }
  }

  /**
   * takes a slice of the voxel field at a particular height
   * and writes the slice to a 2d array
   */
  function extractShadowTextureData(verticalSlice: number) {
    const shadowMap = new Float32Array(size2);
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const val = getValue(field, size, x, verticalSlice, z);
        // somewhere, z got flipped. not sure why.
        shadowMap[x + (size - z) * size] = val;
      }
    }
    return shadowMap;
  }

  function generate(data: WorkerData) {
    //fillFieldWithPerlin();
    cloudInflator(field, size);
    blur();

    // starting at -1 closes up the bottom of the mesh!
    const startValue = -1;
    const endValue = size - 1;
    for (let z = startValue; z < endValue; z++) {
      const zOffset = size2 * z;
      const fz = (z - halfSize) / halfSize;
      for (let y = startValue; y < endValue; y++) {
        const yOffset = zOffset + size * y;
        const fy = (y - halfSize) / halfSize;
        for (let x = startValue; x < endValue; x++) {
          const fx = (x - halfSize) / halfSize;
          const q = yOffset + x;

          polygonize(fx, fy, fz, q, isolation);
        }
      }
    }

    const result: GeometryData = {
      hasPositions: true,
      positionArray,
      hasNormals: true,
      normalArray,
      hasColors: enableColors,
      colorArray,
      hasUvs: enableUvs,
      uvArray,
      count,
      shadowMap: extractShadowTextureData(1),
    };

    console.log('Worker finished');
    context.postMessage(result);
  }

  generate(ev.data);
});
