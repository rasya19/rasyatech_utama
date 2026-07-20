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
if ('serviceWorker' in navigator && window.self === window.top && !import.meta.env.DEV) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('SW registered with scope: ', reg.scope);
    })
    .catch(err => {
      console.log('SW registration failed: ', err);
    });
}