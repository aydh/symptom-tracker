import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, onSnapshot, query, where, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, Typography, Button, Alert, Divider } from '@mui/material';

const FirebaseTest = () => {
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [firestoreStatus, setFirestoreStatus] = useState('Not tested');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Test authentication
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthStatus(user ? `Authenticated as ${user.email}` : 'Not authenticated');
      // Reset Firestore status when auth state changes
      setFirestoreStatus('Not tested');
      setError(null);
      
      if (user) {
        setDebugInfo({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          providerData: user.providerData
        });
      }
    }, (error) => {
      setAuthStatus('Auth error');
      setError(`Authentication error: ${error.message}`);
    });

    return () => unsubscribeAuth();
  }, []);

  const testFirestore = async () => {
    if (!user) {
      setError('You must be logged in to test Firestore access');
      return;
    }

    setFirestoreStatus('Testing...');
    setError(null);
    
    try {
      // Test basic Firestore access with user-specific query
      const testCollection = collection(db, 'symptoms');
      const userQuery = query(testCollection, where('userId', '==', user.uid));
      const snapshot = await getDocs(userQuery);
      setFirestoreStatus(`Success! Found ${snapshot.docs.length} symptoms for user ${user.uid}`);
      
      // Log the first document structure if any exist
      if (snapshot.docs.length > 0) {
        const firstDoc = snapshot.docs[0].data();
        console.log('First symptom document structure:', firstDoc);
      }
    } catch (error) {
      setFirestoreStatus('Failed');
      if (error.code === 'permission-denied') {
        setError(`Permission denied: ${error.message}. This usually means the user is not authenticated or the Firestore rules are blocking access.`);
      } else {
        setError(`Firestore error: ${error.code} - ${error.message}`);
      }
      console.error('Firestore test error:', error);
    }
  };

  const testRealtimeListener = () => {
    if (!user) {
      setError('You must be logged in to test Firestore access');
      return;
    }

    setFirestoreStatus('Testing realtime listener...');
    setError(null);
    
    try {
      const testCollection = collection(db, 'symptoms');
      const userQuery = query(testCollection, where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(userQuery, (snapshot) => {
        setFirestoreStatus(`Realtime listener working! Found ${snapshot.docs.length} symptoms for user ${user.uid}`);
        unsubscribe();
      }, (error) => {
        setFirestoreStatus('Realtime listener failed');
        if (error.code === 'permission-denied') {
          setError(`Permission denied: ${error.message}. This usually means the user is not authenticated or the Firestore rules are blocking access.`);
        } else {
          setError(`Realtime error: ${error.code} - ${error.message}`);
        }
        console.error('Realtime listener error:', error);
      });
    } catch (error) {
      setFirestoreStatus('Failed to set up realtime listener');
      setError(`Listener setup error: ${error.message}`);
    }
  };

  const testDynamicFields = async () => {
    if (!user) {
      setError('You must be logged in to test Firestore access');
      return;
    }

    setFirestoreStatus('Testing dynamic fields access...');
    setError(null);
    
    try {
      const testCollection = collection(db, 'dynamicFields');
      const userQuery = query(testCollection, where('userId', '==', user.uid));
      const snapshot = await getDocs(userQuery);
      setFirestoreStatus(`Success! Found ${snapshot.docs.length} dynamic fields for user ${user.uid}`);
      
      // Log the first document structure if any exist
      if (snapshot.docs.length > 0) {
        const firstDoc = snapshot.docs[0].data();
        console.log('First dynamic field document structure:', firstDoc);
      }
    } catch (error) {
      setFirestoreStatus('Failed');
      if (error.code === 'permission-denied') {
        setError(`Permission denied: ${error.message}. This usually means the user is not authenticated or the Firestore rules are blocking access.`);
      } else {
        setError(`Firestore error: ${error.code} - ${error.message}`);
      }
      console.error('Dynamic fields test error:', error);
    }
  };

  const testCollectionAccess = async () => {
    if (!user) {
      setError('You must be logged in to test Firestore access');
      return;
    }

    setFirestoreStatus('Testing collection access without filters...');
    setError(null);
    
    try {
      const testCollection = collection(db, 'symptoms');
      const basicQuery = query(testCollection, limit(1));
      const snapshot = await getDocs(basicQuery);
      setFirestoreStatus(`Collection access test: Found ${snapshot.docs.length} documents (limited to 1)`);
      
      if (snapshot.docs.length > 0) {
        const firstDoc = snapshot.docs[0].data();
        console.log('First document in collection:', firstDoc);
        console.log('Document ID:', snapshot.docs[0].id);
        console.log('Document userId field:', firstDoc.userId);
        console.log('Current user UID:', user.uid);
        console.log('UIDs match?', firstDoc.userId === user.uid);
      }
    } catch (error) {
      setFirestoreStatus('Collection access failed');
      setError(`Collection access error: ${error.code} - ${error.message}`);
      console.error('Collection access test error:', error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase Connection Test
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Authentication Status:</Typography>
        <Typography>{authStatus}</Typography>
        {user && (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'blue.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              UID: {user.uid}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email Verified: {user.emailVerified ? 'Yes' : 'No'}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Firestore Tests:</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Current User UID: {user?.uid || 'Not logged in'}
        </Typography>
        <Typography>{firestoreStatus}</Typography>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={testCollectionAccess}
            disabled={!user}
          >
            Test Collection Access
          </Button>
          <Button 
            variant="contained" 
            onClick={testFirestore}
            disabled={!user}
          >
            Test Symptoms Access
          </Button>
          <Button 
            variant="outlined" 
            onClick={testRealtimeListener}
            disabled={!user}
          >
            Test Realtime Listener
          </Button>
          <Button 
            variant="outlined" 
            onClick={testDynamicFields}
            disabled={!user}
          >
            Test Dynamic Fields
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

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
        {user && (
          <Typography variant="body2">
            User UID: {user.uid}
          </Typography>
        )}
      </Box>

      {!user && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please log in first to test Firestore access. The Firestore rules require authentication.
        </Alert>
      )}
    </Box>
  );
};

export default FirebaseTest;
