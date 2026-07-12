import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Unregister stale service workers that interfere with network requests
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch((err) => {
    console.error('Failed to unregister service worker:', err);
  });
}

// Disable all console logging in production for security, and display a customized security warning message
if (import.meta.env.PROD) {
  const originalLog = console.log;
  
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.error = () => {};

  originalLog(
    "%c🛑 STOP! %cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.",
    "color: #ef4444; font-size: 20px; font-weight: bold; font-family: sans-serif; text-shadow: 1px 1px 0px rgba(0,0,0,0.2);",
    "color: #f3f4f6; font-size: 14px; font-family: sans-serif; line-height: 1.5;"
  );
  originalLog(
    "%cCyberlogic Club Portal %c— Secure Production Console Active.",
    "color: #06b6d4; font-weight: bold; font-size: 14px; font-family: sans-serif;",
    "color: #9ca3af; font-size: 12px; font-family: sans-serif;"
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
