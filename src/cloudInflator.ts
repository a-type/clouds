import tumult from 'tumult';
import random from 'seedrandom';
import { setValue, getValue } from './voxelField';

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
 * how high the base layer is positioned from the ground. a larger value allows clouds
 * to expand downward
 */
const baseElevation = 0;
/** how much space to leave on the outside for the cloud to grow into */
const padding = baseInflationSize * 2;
/** suppresses the presence of the initial noise base */
const noiseDampening = 0;
/**
 * the sample area from perlin noise. independent of the total
 * voxel field size, so adjusting the voxel field size will change the 'resolution'
 * of the shape, but not the shape itself.
 */
const noiseSize = 4;
/** rolls the dice on whether a particular point gets inflated if it is a valid candidate already */
const inflationChance = 0.5;

const seed = 'seed' + Math.random() * 100000;
const rand = random(seed);
const perlin = new tumult.Perlin2(seed);

function generatePerlinBase(field: Float32Array, size: number) {
  const noiseScaling = noiseSize / size;
  const overlayCircleRadius = size / 2 - padding;

  let px = 0,
    py = baseElevation,
    pz = 0;
  for (px = 0; px < size; px++) {
    for (pz = 0; pz < size; pz++) {
      const mag = Math.sqrt(
        Math.pow(px - size / 2, 2) + Math.pow(pz - size / 2, 2),
      );
      const circleOverlap = Math.max(Math.min(overlayCircleRadius - mag, 1), 0);
      setValue(
        field,
        size,
        px,
        py,
        pz,
        Math.max(
          0,
          perlin.gen(px * noiseScaling, pz * noiseScaling) - noiseDampening,
        ) * circleOverlap,
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
        setValue(
          values,
          diameter,
          realX,
          realY,
          realZ,
          Math.max(Math.min(radius - distance, 1), 0),
        );
      }
    }
  }
  return values;
}

export default function(
  field: Float32Array,
  size: number,
  inflationPasses: number = 2,
) {
  field = generatePerlinBase(field, size);
  for (let i = 0; i < inflationPasses; i++) {
    field = inflateIteration(field, size);
  }
  return field;
}
