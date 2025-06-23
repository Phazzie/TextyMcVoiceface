import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SeamManager } from './services/SeamManager.ts';
import { CacheManagerStub } from './services/stubs/CacheManagerStub.ts';
import { PerformanceMonitorStub } from './services/stubs/PerformanceMonitorStub.ts';
import { BackgroundProcessorStub } from './services/stubs/BackgroundProcessorStub.ts';

// Initialize SeamManager with stubs
const seamManager = SeamManager.getInstance();
seamManager.registerCacheManager(new CacheManagerStub());
seamManager.registerPerformanceMonitor(new PerformanceMonitorStub());
seamManager.registerBackgroundProcessor(new BackgroundProcessorStub());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
