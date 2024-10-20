import React, { useCallback, memo } from 'react';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Logout = memo(function Logout() {
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    const auth = getAuth();
    signOut(auth)
      .then(() => navigate('/'))
      .catch((error) => console.error('Error signing out:', error));
  }, [navigate]);

  return (
    <Button 
      variant="contained" 
      color="secondary" 
      onClick={handleLogout}
      endIcon={<LogoutIcon />}
    >
      Logout
    </Button>
  );
});

export default Logout;
