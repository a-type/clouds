import { perlin3 } from './perlin';
import random from 'seedrandom';

/**
 * this algorithm is designed to lay down a 2d plane which represents the
 * base of the cloud, then 'inflate' that plane into a vertical structure.
 *
 * clouds have a 'floor' which roughly represents a high pressure zone that
 * the cloud floats above. however, the water droplets are also affected
 * by gravity. so as the volume grows, the cloud expands outward with a flat
 * bottom, and also upward as it grows into (random) low-pressure pockets
 */

/**
 * The minimum size each point will inflate to during an inflation pass
 */
const baseInflationSize = 4;
/**
 * Number of times to iterate over points and inflate them
 */
const inflationPasses = 2;
/**
 * how high the base layer is positioned from the ground. a larger value allows clouds
 * to expand downward
 */
const baseElevation = 0;
/** how much space to leave on the outside for the cloud to grow into */
const padding = baseInflationSize * 2;
/** suppresses the presence of the initial noise base */
const noiseDampening = 0.1;
/** rolls the dice on whether a particular point gets inflated if it is a valid candidate already */
const inflationChance = 0.5;

const rand = random('seed');

function setValue(
  field: Float32Array,
  size: number,
  x: number,
  y: number,
  z: number,
  value: number,
) {
  if (x >= size || x < 0 || y >= size || y < 0 || z >= size || z < 0) {
    return;
  }

  field[x + y * size + z * size * size] = value;
}

function getValue(
  field: Float32Array,
  size: number,
  x: number,
  y: number,
  z: number,
) {
  return field[x + y * size + z * size * size];
}

function generatePerlinBase(field: Float32Array, size: number) {
  const stepSize = 1;
  const m = stepSize / (size / 2);
  const overlayCircleRadius = size / 2 - padding;

  let px = 0,
    py = baseElevation,
    pz = 0;
  for (px = 0; px < size; px++) {
    for (pz = 0; pz < size; pz++) {
      const mag = Math.sqrt(
        Math.pow(px - size / 2, 2) + Math.pow(pz - size / 2, 2),
      );
      if (mag < overlayCircleRadius)
        setValue(
          field,
          size,
          px,
          py,
          pz,
          Math.max(
            0,
            perlin3(px * m * 2 + 5, py * m * 2 + 3, pz * m * 2 + 0.5) -
              noiseDampening,
          ),
        );
    }
  }
  return field;
}

function inflateIteration(field: Float32Array, size: number) {
  const fieldSnapshot = field.slice();

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        // inflation is inverse of the distance from the center of the cloud;
        // i.e. more central parts will be larger
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - size / 2, 2) +
            Math.pow(y - size / 2, 2) +
            Math.pow(z - size / 2, 2),
        );
        // and it's a square rule
        const overallInflationFactor = Math.pow(
          size / 2 / distanceFromCenter,
          2,
        );

        const currentValue = getValue(fieldSnapshot, size, x, y, z);
        if (currentValue > 0 && rand() > inflationChance) {
          const sphereRadius = Math.floor(
            baseInflationSize * overallInflationFactor * Math.pow(rand(), 2),
          );

          const verticalDisplacement = Math.floor(
            rand() * sphereRadius * overallInflationFactor,
          );

          const sphereDiameter = sphereRadius * 2;
          const sphere = generateSphere(sphereRadius);
          for (let sx = 0; sx < sphereDiameter; sx++) {
            const absSx = sx - sphereRadius + x;
            for (let sy = 0; sy < sphereDiameter; sy++) {
              const absSy = sy - sphereRadius + y + verticalDisplacement;
              for (let sz = 0; sz < sphereDiameter; sz++) {
                const absSz = sz - sphereRadius + z;
                const sphereValue = getValue(
                  sphere,
                  sphereDiameter,
                  sx,
                  sy,
                  sz,
                );
                const previousValue = getValue(
                  fieldSnapshot,
                  size,
                  absSx,
                  absSy,
                  absSz,
                );
                setValue(
                  field,
                  size,
                  absSx,
                  absSy,
                  absSz,
                  previousValue + sphereValue,
                );
              }
            }
          }
        }
      }
    }
  }

  return field;
}

function magnitude([x, y, z]: [number, number, number]) {
  return Math.sqrt(x * x + y * y + z * z);
}

function normalize([x, y, z]: [number, number, number]) {
  const mag = magnitude([x, y, z]);
  return [x / mag, y / mag, z / mag];
}

function shortenBy1([x, y, z]: [number, number, number]) {
  const mag = magnitude([x, y, z]);
  return [(x / mag) * (mag - 1), (y / mag) * (mag - 1), (z / mag) * (mag - 1)];
}

/**
 * generates a flat array of values in the shape of a sphere,
 * meant to be transposed and added to a particular point.
 */
function generateSphere(radius: number) {
  const diameter = radius * 2;

  if (radius === 0) {
    return new Float32Array(diameter * diameter * diameter);
  }

  const values = new Float32Array(diameter * diameter * diameter);
  for (let absX = -radius; absX <= radius; absX++) {
    const realX = absX + radius;
    for (let absY = -radius; absY <= radius; absY++) {
      const realY = absY + radius;
      for (let absZ = -radius; absZ <= radius; absZ++) {
        const realZ = absZ + radius;
        const distance = Math.sqrt(absX * absX + absY * absY + absZ * absZ);
        if (distance < radius)
          setValue(
            values,
            diameter,
            realX,
            realY,
            realZ,
            //Math.max(Math.min(radius - distance, 1), 0),
            1,
          );
      }
    }
  }
  return values;
}

export default function(field: Float32Array, size: number) {
  field = generatePerlinBase(field, size);
  for (let i = 0; i < inflationPasses; i++) {
    field = inflateIteration(field, size);
  }
  // const sphere = generateSphere(size / 4);
  // for (let sx = 0; sx < size / 2; sx++) {
  //   for (let sy = 0; sy < size / 2; sy++) {
  //     for (let sz = 0; sz < size / 2; sz++) {
  //       const sphereValue = getValue(sphere, size / 2, sx, sy, sz);
  //       setValue(field, size, sx, sy, sz, sphereValue);
  //     }
  //   }
  // }
  return field;
}
