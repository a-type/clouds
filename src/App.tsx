import React from 'react';
import './App.css';
import { Canvas } from 'react-three-fiber';
import { PerlinModel } from './PerlinModel';

const App: React.FC = () => {
  return (
    <div className="App">
      <Canvas>
        <PerlinModel />
      </Canvas>
    </div>
  );
};

export default App;
