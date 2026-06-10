import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  const path = window.location.pathname;
  const scope = path.startsWith('/master-admin') 
  ? '/master-admin/' 
  : '/admin/';
    const registerSW = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('SW registered successfully with scope: ', reg.scope);
      })
      .catch(err => {
        console.log('SW registration failed: ', err);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}
