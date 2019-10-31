/**
 * Utilities for working with a packed voxel field
 */

export function setValue(
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

export function getValue(
  field: Float32Array,
  size: number,
  x: number,
  y: number,
  z: number,
) {
  return field[x + y * size + z * size * size];
}
