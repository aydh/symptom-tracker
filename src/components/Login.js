import React, { useState, useCallback, useMemo } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const textFieldCommonProps = {
  margin: "normal",
  required: true,
  fullWidth: true,
};

function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = useCallback((name) => (e) => {
    setCredentials(prev => ({ ...prev, [name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(getAuth(), credentials.email, credentials.password);
      console.log('Login successful:', userCredential.user);
      navigate('/track');
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      setError(error.message);
    }
  }, [credentials, navigate]);

  const isSubmitDisabled = useMemo(() => {
    return !credentials.email || !credentials.password;
  }, [credentials.email, credentials.password]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, maxWidth: 400, margin: 'auto' }}>
      <TextField
        {...textFieldCommonProps}
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={credentials.email}
        onChange={handleChange('email')}
      />
      <TextField
        {...textFieldCommonProps}
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={credentials.password}
        onChange={handleChange('password')}
      />
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isSubmitDisabled}
      >
        Sign In
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          component={Link}
          to="/signup"
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Don't have an account? Sign Up
        </Button>
      </Box>
    </Box>
  );
}

export default Login;
