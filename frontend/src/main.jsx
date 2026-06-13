/**
 * @file        main.jsx
 * @module      root
 * @description Application entrypoint mounting the React DOM tree.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
