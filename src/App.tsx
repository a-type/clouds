import React from 'react';
import './App.css';
import { Canvas } from 'react-three-fiber';
import { Vector3, Color } from 'three';
import { Camera } from './Camera';
import { CloudMap } from './CloudMap';
import { Sun } from './Sun';
import {
  skyColor,
  sunColor,
  ambientLightColor as ambientLightColorString,
} from './colors';

const pointLightPosition = new Vector3(0, 10, 5);
const pointLightColor = new Color(sunColor);
const ambientLightColor = new Color(ambientLightColorString);

const windVelocity = new Vector3(0.001, 0, 0);

const cameraPosition = [0, 8, 10];

const App: React.FC = () => {
  return (
    <div className="App">
      <Canvas shadowMap style={{ backgroundColor: skyColor }}>
        <Camera position={cameraPosition} />
        <Sun position={pointLightPosition} color={pointLightColor} />
        <ambientLight color={ambientLightColor} />
        <CloudMap
          pointLightPosition={pointLightPosition}
          pointLightColor={pointLightColor}
          ambientLightColor={ambientLightColor}
          velocity={windVelocity}
        />
      </Canvas>
    </div>
  );
};

export default App;
