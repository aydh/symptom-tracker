console.log('React script starting...');

// Add visible debugging to the page
const debugDiv = document.getElementById('debug-info');
if (debugDiv) {
  debugDiv.innerHTML += '<p>React script loaded at: ' + new Date().toLocaleTimeString() + '</p>';
}

try {
  const { createRoot } = await import('react-dom/client');
  const { StrictMode, useState, useEffect } = await import('react');
  const React = await import('react');
  const { BrowserRouter, Routes, Route, Navigate } = await import('react-router-dom');
  
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
  
  // Simple App component with basic routing
  const App = () => {
    const [status, setStatus] = useState('Loading...');
    
    useEffect(() => {
      setStatus('App loaded successfully!');
      if (debugDiv) {
        debugDiv.innerHTML += '<p>App component mounted</p>';
      }
    }, []);
    
    return (
      <BrowserRouter>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', background: 'white', minHeight: '100vh' }}>
          <h1>✅ Symptom Tracker App</h1>
          <p>React 19 + Vite + React Router is working correctly!</p>
          <p>Status: {status}</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
          
          <Routes>
            <Route path="/" element={
              <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                <h3>Home Page</h3>
                <p>✅ React 19 working</p>
                <p>✅ Vite working</p>
                <p>✅ React Router working</p>
                <p>⏳ Adding back components...</p>
              </div>
            } />
            <Route path="/test" element={
              <div style={{ marginTop: '20px', padding: '10px', background: '#e8f5e8', borderRadius: '5px' }}>
                <h3>Test Page</h3>
                <p>Routing is working! You can navigate between pages.</p>
                <a href="/" style={{ color: 'blue' }}>← Back to Home</a>
              </div>
            } />
          </Routes>
          
          <div style={{ marginTop: '20px' }}>
            <a href="/test" style={{ color: 'blue', marginRight: '10px' }}>Test Route</a>
          </div>
        </div>
      </BrowserRouter>
    );
  };
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p>About to render App component</p>';
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
