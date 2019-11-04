import tumult from 'tumult';
import { Color } from 'three';

const noiseDampening = 0.3;
const noiseTippingPoint = 0.01;

const seed = 'seed' + Math.random() * 100000;

const perlin = new tumult.Perlin2(seed);

const context = self; // eslint-disable-line no-restricted-globals

context.addEventListener('message', function(ev) {
  console.debug('Land worker started');
  const {
    resolution = 128,
    noiseSize = 64,
    groundColor1,
    groundColor2,
  }: any = ev.data;

  const parsedGroundColor1 = parseColor(groundColor1);
  const parsedGroundColor2 = parseColor(groundColor2);

  const getColor = (noiseValue: number) => {
    if (noiseValue > noiseTippingPoint) {
      return parsedGroundColor2;
    }
    return parsedGroundColor1;

    return interpolateColors(
      parsedGroundColor1,
      parsedGroundColor2,
      noiseValue,
    );
  };

  const textureData = new Uint8Array(3 * resolution * resolution);

  let px = 0,
    py = 0;
  const noiseScaling = noiseSize / resolution;
  for (px = 0; px < resolution; px++) {
    for (py = 0; py < resolution; py++) {
      const mapIndex = px + py * resolution;
      const stride = mapIndex * 3;
      const noiseVal =
        perlin.gen(px * noiseScaling, py * noiseScaling) - noiseDampening;
      const [r, g, b] = getColor(noiseVal);
      textureData[stride] = r;
      textureData[stride + 1] = g;
      textureData[stride + 2] = b;
    }
  }

  context.postMessage({
    textureData,
  });
  console.debug('Land worker finished');
});

const parseColor = (color: string): [number, number, number] => {
  if (!color.startsWith('#')) {
    throw new Error('Color ' + color + ' does not start with #');
  }
  const r = color.slice(1, 3);
  const g = color.slice(3, 5);
  const b = color.slice(5, 7);
  return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
};

const interpolateColors = (
  a: [number, number, number],
  b: [number, number, number],
  v: number,
) => {
  const val = Math.max(0, Math.min(1, v));
  return [lerp(a[0], b[0], val), lerp(a[1], b[1], val), lerp(a[2], b[2], val)];
};

const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
