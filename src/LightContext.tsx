import { createContext } from 'react';
import { Vector3, Color } from 'three';
import { sunColor, ambientLightColor } from './colors';

export default createContext<{
  pointLightPosition: Vector3;
  pointLightColor: Color;
  ambientLightColor: Color;
}>({
  pointLightPosition: new Vector3(0, 100, 0),
  pointLightColor: new Color(sunColor),
  ambientLightColor: new Color(ambientLightColor),
});
