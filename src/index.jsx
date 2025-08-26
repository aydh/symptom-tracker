console.log('React script starting...');

// Add visible debugging to the page
const debugDiv = document.getElementById('debug-info');
if (debugDiv) {
  debugDiv.innerHTML += '<p>React script loaded at: ' + new Date().toLocaleTimeString() + '</p>';
}

try {
  const { createRoot } = await import('react-dom/client');
  const { StrictMode } = await import('react');
  const React = await import('react');
  
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
  
  // Simple test component
  const TestComponent = () => {
    if (debugDiv) {
      debugDiv.innerHTML += '<p>TestComponent rendering</p>';
    }
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', background: 'white' }}>
        <h1>✅ React is Working!</h1>
        <p>If you can see this, React 19 + Vite is working correctly!</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    );
  };
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p>About to render React component</p>';
  }
  
  root.render(
    <StrictMode>
      <TestComponent />
    </StrictMode>
  );
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p style="color: green;">React render completed successfully!</p>';
  }
  
} catch (error) {
  console.error('Error in React setup:', error);
  const debugDiv = document.getElementById('debug-info');
  if (debugDiv) {
    debugDiv.innerHTML += '<p style="color: red;">Error: ' + error.message + '</p>';
    debugDiv.innerHTML += '<pre style="color: red;">' + error.stack + '</pre>';
  }
}
