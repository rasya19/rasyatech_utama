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

// PWA Service Worker Registration - DIPISAH SCOPE NYA
if ('serviceWorker' in navigator) {
  const path = window.location.pathname;
  const scope = path.startsWith('/master-admin') 
    ? '/master-admin/' 
    : '/admin/'; // default admin
    
  navigator.serviceWorker.register('/sw.js', { scope }) // ← pake variabel scope, bukan '/'
    .then(reg => {
      console.log('SW registered with scope: ', reg.scope);
    })
    .catch(err => {
      console.log('SW registration failed: ', err);
    });
}