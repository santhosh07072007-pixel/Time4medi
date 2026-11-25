import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mobile detection
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && window.innerHeight <= 1024);
};

// Add mobile class to body
if (isMobile()) {
  document.body.classList.add('mobile-device');
}

// Remove initial loading screen
const removeLoadingScreen = () => {
  const loadingElement = document.querySelector('.initial-loading');
  if (loadingElement) {
    setTimeout(() => {
      loadingElement.style.opacity = '0';
      setTimeout(() => {
        loadingElement.remove();
      }, 300);
    }, 500);
  }
};

// Error boundary for mobile debugging
const handleError = (error: Error) => {
  console.error('Application error:', error);
  
  // Remove loading screen if error occurs
  removeLoadingScreen();
  
  // Show error message on mobile
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fee2e2;
    color: #dc2626;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    overflow: auto;
    font-size: 14px;
    line-height: 1.4;
  `;
  errorDiv.innerHTML = `
    <h1 style="font-size: 18px; margin-bottom: 10px;">App Loading Error</h1>
    <p style="margin-bottom: 15px;">Something went wrong while loading the app. Please try refreshing the page.</p>
    ${isMobile() ? '<p style="font-size: 12px; color: #666; margin-bottom: 15px;">If you\'re on mobile, try opening in Chrome or Safari.</p>' : ''}
    <details>
      <summary>Error Details</summary>
      <pre style="font-size: 11px; overflow: auto; max-height: 200px;">${error.message}\n${error.stack}</pre>
    </details>
    <button onclick="window.location.reload()" style="
      background: #dc2626;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      margin-top: 20px;
      cursor: pointer;
      min-height: 44px;
      width: 100%;
    ">Refresh Page</button>
  `;
  document.body.appendChild(errorDiv);
};

// Initialize app with error handling
try {
  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
} catch (error) {
  handleError(error as Error);
}

function initializeApp() {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    // Remove loading screen after React renders
    setTimeout(removeLoadingScreen, 200);
    
  } catch (error) {
    console.error('App initialization error:', error);
    handleError(error as Error);
  }
}

// Global error handlers for mobile debugging
window.addEventListener('error', (event) => {
  handleError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(event.reason));
});
