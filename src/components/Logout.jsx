import { useCallback, memo } from 'react';
import { Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const ColouredLogoutIcon = styled(LogoutIcon)(({ theme }) => ({
  color: theme.palette.icon.main, // Using the color from the theme
}));
const Logout = memo(function Logout() {
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    const auth = getAuth();
    console.log('Logging out:',auth.currentUser.email);
    signOut(auth)
      .then(() => {
        console.log('User logged out successfully.');
        navigate('/');
      })
      .catch((error) => console.error('Error signing out:', error));
  }, [navigate]);

  return (
    <Button 
      variant="contained" 
      color="secondary" 
      onClick={handleLogout}
      endIcon={<ColouredLogoutIcon />}
    >
      Logout
    </Button>
  );
});

export default Logout;
