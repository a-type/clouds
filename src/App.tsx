import React from 'react';
import './App.css';
import { Canvas } from 'react-three-fiber';
import { PerlinModel } from './PerlinModel';
import { Vector3, Color } from 'three';

const pointLightPosition = new Vector3(0, 100, 0);
const pointLightColor = new Color(0xff3300);
const ambientLightColor = new Color(0x080808);

const App: React.FC = () => {
  return (
    <div className="App">
      <Canvas>
        <pointLight position={pointLightPosition} color={pointLightColor} />
        <ambientLight color={ambientLightColor} />
        <PerlinModel
          pointLightPosition={pointLightPosition}
          pointLightColor={pointLightColor}
          ambientLightColor={ambientLightColor}
        />
      </Canvas>
    </div>
  );
};

export default App;
