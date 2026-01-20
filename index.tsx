import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');

// 1. Check if the element exists
if (!rootElement) {
  document.body.innerHTML = '<h1 style="color:red">CRITICAL: "root" div not found in HTML</h1>';
  throw new Error("Could not find root element to mount to");
}

// 2. Wrap the startup in a Safety Net
try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} catch (err: any) {
  // 3. If it crashes, show the error on the screen
  rootElement.innerHTML = `
    <div style="color: #ff5555; padding: 40px; font-family: monospace; font-size: 16px;">
      <h1 style="font-size: 24px; margin-bottom: 20px;">⚠️ The App Crashed</h1>
      <p style="background: #2a0000; padding: 20px; border-radius: 8px; border: 1px solid #ff0000;">
        ${err.toString()}
      </p>
      <p>Check the Console (F12) for more details.</p>
    </div>
  `;
  console.error("APP CRASHED:", err);
}