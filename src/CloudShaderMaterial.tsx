import React, { FC, useMemo, useContext } from 'react';
import Shader from './shaders/CloudShader';
import { Color } from 'three';
import {
  cloudWhiteColor,
  cloudShadowColor1,
  cloudShadowColor2,
} from './colors';
import LightContext from './LightContext';

export type CloudShaderMaterialProps = {
  baseColor?: Color;
  shadeColor1?: Color;
  shadeColor2?: Color;
  attach?: string;
};

const white = new Color(cloudWhiteColor);
const shadow1 = new Color(cloudShadowColor1);
const shadow2 = new Color(cloudShadowColor2);

export const CloudShaderMaterial: FC<CloudShaderMaterialProps> = ({
  baseColor = white,
  shadeColor1 = shadow1,
  shadeColor2 = shadow2,
  ...rest
}) => {
  const { pointLightPosition, pointLightColor, ambientLightColor } = useContext(
    LightContext,
  );

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        ...Shader.uniforms,
        uDirLightPos: { value: pointLightPosition },
        uDirLightColor: { value: pointLightColor },
        uAmbientLightColor: { value: ambientLightColor },
        uBaseColor: { value: baseColor },
        uLineColor1: { value: shadeColor1 },
        uLineColor2: { value: shadeColor2 },
      },
      vertexShader: Shader.vertexShader,
      fragmentShader: Shader.fragmentShader,
    }),
    [
      pointLightColor,
      pointLightPosition,
      ambientLightColor,
      baseColor,
      shadeColor1,
      shadeColor2,
    ],
  );

  return <shaderMaterial args={[shaderArgs]} {...rest} />;
};
