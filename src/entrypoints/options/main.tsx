import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../styles/globals.css';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.textContent = 'PhenoChart settings failed to initialize.';
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
