console.log('React script starting...');

// Add visible debugging to the page
const debugDiv = document.getElementById('debug-info');
if (debugDiv) {
  debugDiv.innerHTML += '<p>React script loaded at: ' + new Date().toLocaleTimeString() + '</p>';
}

// Add error handling for the entire script
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (debugDiv) {
    debugDiv.innerHTML += '<p style="color: red;">Global error: ' + event.error.message + '</p>';
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (debugDiv) {
    debugDiv.innerHTML += '<p style="color: red;">Promise error: ' + event.reason + '</p>';
  }
});

try {
  const { createRoot } = await import('react-dom/client');
  const { StrictMode } = await import('react');
  const React = await import('react');
  
  // Import the original App component
  const { default: App } = await import('./App.jsx');
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p>React imports successful</p>';
  }
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p>Root element found, creating React root</p>';
  }
  
  const root = createRoot(rootElement);
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p>About to render original App component</p>';
  }
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p style="color: green;">App render completed successfully!</p>';
  }
  
} catch (error) {
  console.error('Error in React setup:', error);
  const debugDiv = document.getElementById('debug-info');
  if (debugDiv) {
    debugDiv.innerHTML += '<p style="color: red;">Error: ' + error.message + '</p>';
    debugDiv.innerHTML += '<pre style="color: red;">' + error.stack + '</pre>';
  }
}
