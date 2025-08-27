import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, Typography, Button, Alert } from '@mui/material';

const FirebaseTest = () => {
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [firestoreStatus, setFirestoreStatus] = useState('Not tested');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Test authentication
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthStatus(user ? `Authenticated as ${user.email}` : 'Not authenticated');
    }, (error) => {
      setAuthStatus('Auth error');
      setError(`Authentication error: ${error.message}`);
    });

    return () => unsubscribeAuth();
  }, []);

  const testFirestore = async () => {
    setFirestoreStatus('Testing...');
    setError(null);
    
    try {
      // Test basic Firestore access
      const testCollection = collection(db, 'symptoms');
      const snapshot = await getDocs(testCollection);
      setFirestoreStatus(`Success! Found ${snapshot.docs.length} documents`);
    } catch (error) {
      setFirestoreStatus('Failed');
      setError(`Firestore error: ${error.code} - ${error.message}`);
      console.error('Firestore test error:', error);
    }
  };

  const testRealtimeListener = () => {
    setFirestoreStatus('Testing realtime listener...');
    setError(null);
    
    try {
      const testCollection = collection(db, 'symptoms');
      const unsubscribe = onSnapshot(testCollection, (snapshot) => {
        setFirestoreStatus(`Realtime listener working! Found ${snapshot.docs.length} documents`);
        unsubscribe();
      }, (error) => {
        setFirestoreStatus('Realtime listener failed');
        setError(`Realtime error: ${error.code} - ${error.message}`);
        console.error('Realtime listener error:', error);
      });
    } catch (error) {
      setFirestoreStatus('Failed to set up realtime listener');
      setError(`Listener setup error: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase Connection Test
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Authentication Status:</Typography>
        <Typography>{authStatus}</Typography>
        {user && (
          <Typography variant="body2" color="text.secondary">
            UID: {user.uid}
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Firestore Status:</Typography>
        <Typography>{firestoreStatus}</Typography>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={testFirestore}
            sx={{ mr: 2 }}
          >
            Test Basic Access
          </Button>
          <Button 
            variant="outlined" 
            onClick={testRealtimeListener}
          >
            Test Realtime Listener
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="h6">Debug Info:</Typography>
        <Typography variant="body2">
          Domain: {window.location.hostname}
        </Typography>
        <Typography variant="body2">
          Protocol: {window.location.protocol}
        </Typography>
        <Typography variant="body2">
          User Agent: {navigator.userAgent}
        </Typography>
      </Box>
    </Box>
  );
};

export default FirebaseTest;
