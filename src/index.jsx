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
  const { getFirestore, collection, addDoc, query, where, orderBy, getDocs } = await import('firebase/firestore');
  
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
  const db = getFirestore(app);
  
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
  
  // Simple Symptom Tracker Component
  const SymptomTracker = ({ user }) => {
    const [symptoms, setSymptoms] = useState([]);
    const [newSymptom, setNewSymptom] = useState('');
    const [severity, setSeverity] = useState(5);
    const [symptomDate, setSymptomDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    
    const addSymptom = async (e) => {
      e.preventDefault();
      if (!newSymptom.trim()) return;
      
      setLoading(true);
      setStatus('Saving symptom...');
      try {
        const selectedDate = new Date(symptomDate);
        const symptomData = {
          symptom: newSymptom,
          severity: severity,
          timestamp: selectedDate.toISOString(),
          date: symptomDate,
          time: selectedDate.toLocaleTimeString(),
          userId: user.uid
        };
        
        const docRef = await addDoc(collection(db, 'symptoms'), symptomData);
        setStatus('Symptom saved successfully!');
        setNewSymptom('');
        setSeverity(5);
        setSymptomDate(new Date().toISOString().split('T')[0]);
        await loadSymptoms();
        setTimeout(() => setStatus(''), 3000); // Clear status after 3 seconds
      } catch (error) {
        setStatus('Error saving symptom: ' + error.message);
        console.error('Error adding symptom:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const loadSymptoms = async () => {
      try {
        setStatus('Loading symptoms...');
        const q = query(
          collection(db, 'symptoms'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const symptomsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by timestamp in JavaScript
        symptomsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setSymptoms(symptomsList);
        setStatus(`Loaded ${symptomsList.length} symptoms`);
        setTimeout(() => setStatus(''), 2000); // Clear status after 2 seconds
      } catch (error) {
        setStatus('Error loading symptoms: ' + error.message);
        console.error('Error loading symptoms:', error);
      }
    };
    
    useEffect(() => {
      loadSymptoms();
    }, [user.uid]);
    
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Symptom Tracker</h2>
          <button 
            onClick={() => auth.signOut()}
            style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
        
        {status && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            background: status.includes('Error') ? '#f8d7da' : '#d4edda', 
            color: status.includes('Error') ? '#721c24' : '#155724',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {status}
          </div>
        )}
        
        <form onSubmit={addSymptom} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Date:</label>
            <input
              type="date"
              value={symptomDate}
              onChange={(e) => setSymptomDate(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Symptom:</label>
            <input
              type="text"
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              placeholder="Describe your symptom..."
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Severity (1-10): {severity}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Adding...' : 'Add Symptom'}
          </button>
        </form>
        
        <div>
          <h3>Recent Symptoms</h3>
          {symptoms.length === 0 ? (
            <p>No symptoms recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {symptoms.slice(0, 10).map((symptom) => (
                <div key={symptom.id} style={{ padding: '15px', background: 'white', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{symptom.symptom}</strong>
                    <span style={{ 
                      padding: '4px 8px', 
                      background: severity > 7 ? '#dc3545' : severity > 4 ? '#ffc107' : '#28a745',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Severity: {symptom.severity}
                    </span>
                  </div>
                  <small style={{ color: '#666' }}>
                    {symptom.date} at {symptom.time}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
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
                <SymptomTracker user={user} />
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
