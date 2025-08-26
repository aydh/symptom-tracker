
import React from 'react';
import Button from '@mui/material/Button';

const ClearCacheButton = ({ onClick }) => (
  <Button color="inherit" onClick={onClick} sx={{ marginRight: 2 }}>
    Refresh
  </Button>
);

export default React.memo(ClearCacheButton);
