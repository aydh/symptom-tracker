import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth } from './firebase';
import Signup from './components/Signup';
import Login from './components/Login';
import Logout from './components/Logout';
import SymptomTracker from './components/SymptomTracker';
import SymptomAnalysis from './components/SymptomAnalysis';
import SymptomTable from './components/SymptomTable';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';

const NavButton = React.memo(({ to, children }) => (
  <Button color="inherit" component={Link} to={to} sx={{ marginRight: 2 }}>
    {children}
  </Button>
));

const appBarSx = { flexGrow: 1 };
const typographySx = { flexGrow: 1 };
const userEmailSx = { marginRight: 2 };

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  const renderProtectedRoute = useCallback((path, Component) => (
    <Route 
      key={path}
      path={path} 
      element={user ? <Component user={user} /> : <Navigate to="/" replace />} 
    />
  ), [user]);

  const routes = useMemo(() => (
    <>
      <Route path="/" element={user ? <Navigate to="/track" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/track" replace /> : <Signup />} />
      {renderProtectedRoute("/track", SymptomTracker)}
      {renderProtectedRoute("/analyse", SymptomAnalysis)}
      {renderProtectedRoute("/table", SymptomTable)}
    </>
  ), [user, renderProtectedRoute]);

  const navButtons = useMemo(() => (
    user && (
      <>
        <Typography variant="body2" sx={userEmailSx}>
          {user.email}
        </Typography>
        <NavButton to="/track">Track</NavButton>
        <NavButton to="/analyse">Analyse</NavButton>
        <NavButton to="/table">Table</NavButton>
        <Logout />
      </>
    )
  ), [user]);

  return (
    <Router>
      <Box sx={appBarSx}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={typographySx}>
              Symptom Tracker
            </Typography>
            {navButtons}
          </Toolbar>
        </AppBar>
        <Routes>{routes}</Routes>
      </Box>
    </Router>
  );
}

export default React.memo(App);
