import React from 'react';
import './App.css';
import Thing from './Thing';
import { Canvas } from 'react-three-fiber';

const App: React.FC = () => {
  return (
    <div className="App">
      <Canvas>
        <Thing />
      </Canvas>
    </div>
  );
};

export default App;
