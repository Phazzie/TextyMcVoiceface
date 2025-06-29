import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx'; // Adjust path as needed
import './index.css';
import { SeamManager } from './services/SeamManager.ts';
import { CacheManagerStub } from './services/stubs/CacheManagerStub.ts';
import { PerformanceMonitorStub } from './services/stubs/PerformanceMonitorStub.ts';
import { BackgroundProcessorStub } from './services/stubs/BackgroundProcessorStub.ts';
import log from './utils/logger';

// Initialize SeamManager with stubs
const seamManager = SeamManager.getInstance();
seamManager.registerCacheManager(new CacheManagerStub());
seamManager.registerPerformanceMonitor(new PerformanceMonitorStub());
seamManager.registerBackgroundProcessor(new BackgroundProcessorStub());

// Global error handling
window.addEventListener('error', (event) => {
  log.error('Unhandled error:', event.error || event.message, event);
});

window.addEventListener('unhandledrejection', (event) => {
  log.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
