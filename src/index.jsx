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
  const { StrictMode, useState, useEffect } = await import('react');
  const React = await import('react');
  const { BrowserRouter, Routes, Route, Navigate } = await import('react-router-dom');
  
  // Import basic MUI components
  const { Button, AppBar, Toolbar, Typography, Container, Box } = await import('@mui/material');
  
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
  
  // Simple History Component
  const SymptomHistory = ({ user }) => {
    const [symptoms, setSymptoms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const loadAllSymptoms = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'symptoms'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const symptomsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by date (newest first)
        symptomsList.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setSymptoms(symptomsList);
      } catch (error) {
        console.error('Error loading symptoms:', error);
      } finally {
        setLoading(false);
      }
    };
    
    useEffect(() => {
      loadAllSymptoms();
    }, [user.uid]);
    
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>Loading history...</div>;
    }
    
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Symptom History</h2>
        <p>Total symptoms recorded: {symptoms.length}</p>
        
        {symptoms.length === 0 ? (
          <p>No symptoms recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {symptoms.map((symptom) => (
              <div key={symptom.id} style={{ padding: '15px', background: 'white', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{symptom.symptom}</strong>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: symptom.severity > 7 ? '#dc3545' : symptom.severity > 4 ? '#ffc107' : '#28a745',
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
    const [currentView, setCurrentView] = useState('track'); // 'track' or 'history'
    
    if (debugDiv) {
      debugDiv.innerHTML += '<p>App component created</p>';
    }
    
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
    
    if (debugDiv) {
      debugDiv.innerHTML += '<p>App component rendering...</p>';
    }
    
    return (
      <BrowserRouter>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ✅ Symptom Tracker App
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            React 19 + Vite + React Router is working correctly!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Status: {status} | Time: {new Date().toLocaleTimeString()} | View: {currentView}
          </Typography>
          
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Loading...</p>
            </div>
          ) : user ? (
            <>
              <AppBar position="static" sx={{ mb: 3 }}>
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Symptom Tracker
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant={currentView === 'track' ? 'contained' : 'outlined'}
                      onClick={() => setCurrentView('track')}
                      color="primary"
                    >
                      Track
                    </Button>
                    <Button 
                      variant={currentView === 'history' ? 'contained' : 'outlined'}
                      onClick={() => setCurrentView('history')}
                      color="secondary"
                    >
                      History
                    </Button>
                    <Button 
                      variant="contained"
                      onClick={() => auth.signOut()}
                      color="error"
                    >
                      Logout
                    </Button>
                  </Box>
                </Toolbar>
              </AppBar>
              
              {currentView === 'track' ? (
                <SymptomTracker user={user} />
              ) : (
                <SymptomHistory user={user} />
              )}
            </>
          ) : (
            <Login />
          )}
        </Container>
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
