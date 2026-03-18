import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../styles/globals.css';
import { DebugApp } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.textContent = 'Debug view failed to initialize.';
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <DebugApp />
    </React.StrictMode>
  );
}
