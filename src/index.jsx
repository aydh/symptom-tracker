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
  
  // Initialize Firebase
  const { initializeApp } = await import('firebase/app');
  const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
  
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID
  };
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  if (debugDiv) {
    debugDiv.innerHTML += '<p>Firebase initialized successfully</p>';
  }
  
  // Simple Login Component
  const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      
      try {
        if (isSignup) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (error) {
        setError(error.message);
      }
    };
    
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button 
          onClick={() => setIsSignup(!isSignup)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginTop: '10px' }}
        >
          {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </button>
      </div>
    );
  };
  
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
  
  // Simple App component with basic routing and auth
  const App = () => {
    const [status, setStatus] = useState('Loading...');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      setStatus('App loaded successfully!');
      if (debugDiv) {
        debugDiv.innerHTML += '<p>App component mounted</p>';
      }
      
      // Set up Firebase auth listener
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
        setLoading(false);
        if (debugDiv) {
          debugDiv.innerHTML += '<p>Auth state updated: ' + (user ? 'Logged in' : 'Not logged in') + '</p>';
        }
      });
      
      return unsubscribe;
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
              loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p>Loading...</p>
                </div>
              ) : user ? (
                <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                  <h3>Welcome, {user.email}!</h3>
                  <p>✅ React 19 working</p>
                  <p>✅ Vite working</p>
                  <p>✅ React Router working</p>
                  <p>✅ Firebase Auth working</p>
                  <p>✅ Login/Logout working</p>
                  <p>⏳ Adding back components...</p>
                  <button 
                    onClick={() => auth.signOut()}
                    style={{ padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Login />
              )
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
