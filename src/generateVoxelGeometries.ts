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
  };

  const worker = new Worker('./cubes.worker', {
    name: 'CubeWorker',
    type: 'module',
  });
  return new Promise<{ geometry: BufferGeometry; shadow: DataTexture }>(
    (resolve, reject) => {
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

        const shadowData = new Uint8Array(4 * resolution * resolution);
        for (let shadowX = 0; shadowX < resolution; shadowX++) {
          for (let shadowZ = 0; shadowZ < resolution; shadowZ++) {
            const mapIndex = shadowX + shadowZ * resolution;
            const stride = mapIndex * 4;
            shadowData[stride] = 0;
            shadowData[stride + 1] = 0;
            shadowData[stride + 2] = 0;
            shadowData[stride + 3] =
              data.shadowMap[mapIndex] > 0
                ? data.shadowMap[mapIndex] > 0.25
                  ? 35
                  : 25
                : 0;
          }
        }
        // do another pass to blur the shadow
        const blurFactor = 0.75;
        for (let shadowX = 0; shadowX < resolution; shadowX++) {
          for (let shadowZ = 0; shadowZ < resolution; shadowZ++) {
            const stride = (shadowX + shadowZ * resolution) * 4;
            const pixelAlpha = shadowData[stride + 3];
            if (pixelAlpha === 0) {
              continue;
            }
            for (let neighborX = -1; neighborX < 1; neighborX++) {
              for (let neighborZ = -1; neighborZ < 1; neighborZ++) {
                if (neighborX === 0 && neighborZ === 0) continue; // sloppy...
                const neighborStride =
                  (shadowX + neighborX + (shadowZ + neighborZ) * resolution) *
                  4;
                if (neighborStride + 3 < shadowData.length) {
                  shadowData[neighborStride + 3] = Math.min(
                    50,
                    Math.floor(
                      shadowData[neighborStride + 3] + blurFactor * pixelAlpha,
                    ),
                  );
                }
              }
            }
          }
        }
        const shadow = new DataTexture(
          shadowData,
          resolution,
          resolution,
          RGBAFormat,
          UnsignedByteType,
        );

        // this actually screws up our perfectly good normals from
        // generation!
        // geometry.computeVertexNormals();
        // seems to have issues.
        //geometry.computeBoundingSphere();

        resolve({ geometry, shadow });
      });

      worker.postMessage(chunkData);
    },
  );
};
