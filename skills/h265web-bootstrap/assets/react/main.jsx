import React from 'react';
import {createRoot} from 'react-dom/client';
import Player from './Player.jsx';
import '../common/player.css';

createRoot(document.getElementById('app')).render(<React.StrictMode>
  <main><h1>h265web.js 播放示例</h1><Player/></main>
</React.StrictMode>);
