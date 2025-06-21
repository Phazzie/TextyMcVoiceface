import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import log from './utils/logger'; // Import the logger

// Global error handling
window.addEventListener('error', (event) => {
  log.error('Unhandled error:', event.error || event.message, event);
});

window.addEventListener('unhandledrejection', (event) => {
  log.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
