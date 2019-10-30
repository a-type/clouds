import { perlin3 } from './perlin';
/**
 * this algorithm is designed to lay down a 2d plane which represents the
 * base of the cloud, then 'inflate' that plane into a vertical structure.
 *
 * clouds have a 'floor' which roughly represents a high pressure zone that
 * the cloud floats above. however, the water droplets are also affected
 * by gravity. so as the volume grows, the cloud expands outward with a flat
 * bottom, and also upward as it grows into (random) low-pressure pockets
 */

const baseInflationSize = 2;
const inflationPasses = 2;
// how much space to leave on the outside for the cloud to grow into
const padding = 1;

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
  let px = 0,
    pz = 0;
  for (px = padding; px < size - padding; px++) {
    for (pz = padding; pz < size - padding; pz++) {
      setValue(
        field,
        size,
        px + padding,
        0,
        pz + padding,
        perlin3(px * m * 2 + 5, 0 * m * 2 + 3, pz * m * 2 + 0.5),
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
        const currentValue = getValue(fieldSnapshot, size, x, y, z);
        if (currentValue > 0) {
          const sphereRadius =
            baseInflationSize + baseInflationSize * currentValue;
          const sphereDiameter = sphereRadius * 2;
          const sphere = generateSphere(sphereRadius);
          for (let sx = 0; sx < sphereDiameter; sx++) {
            const absSx = sx - sphereRadius + x;
            for (let sy = 0; sy < sphereDiameter; sy++) {
              const absSy = sy - sphereRadius + y;
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
  const values = new Float32Array(diameter * diameter * diameter);
  for (let absX = -radius; absX < radius; absX++) {
    const realX = absX + radius;
    for (let absY = -radius; absY < radius; absY++) {
      const realY = absY + radius;
      for (let absZ = -radius; absZ < radius; absZ++) {
        const realZ = absZ + radius;
        const distance = Math.sqrt(absX * absX + absY * absY + absZ * absZ);
        if (distance < radius) {
          // potential: anti-alias by calculating the percent overlap quantized
          // by the grid size (1)
          setValue(values, diameter, realX, realY, realZ, 1);
        }
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
  return field;
}
