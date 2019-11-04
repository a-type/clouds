import React, { Suspense } from 'react';
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
import { Text } from './Text';
import LightContext from './LightContext';

const lightContext = {
  pointLightPosition: new Vector3(0, 10, 5),
  pointLightColor: new Color(sunColor),
  ambientLightColor: new Color(ambientLightColorString),
};

const windVelocity = new Vector3(0.03, 0, 0);

const cameraPosition = [0, 32, 5];

const App: React.FC = () => {
  return (
    <div className="App">
      <LightContext.Provider value={lightContext}>
        <Canvas shadowMap style={{ backgroundColor: skyColor }}>
          <Suspense fallback={null}>
            <Camera position={cameraPosition} />
            <Sun
              position={lightContext.pointLightPosition}
              color={lightContext.pointLightColor}
            />
            <ambientLight color={lightContext.ambientLightColor} />
            <CloudMap velocity={windVelocity} />
            <Text>Clouds</Text>
          </Suspense>
        </Canvas>
      </LightContext.Provider>
    </div>
  );
};

export default App;
