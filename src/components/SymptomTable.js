import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Typography, CircularProgress, IconButton, Tooltip, Box 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchDynamicFields } from '../utils/dynamicFieldsUtil';
import { fetchSymptoms, deleteSymptom } from '../utils/symptomUtils';
import { styled } from '@mui/material/styles';

const ColouredDeleteIcon = styled(DeleteIcon)(({ theme }) => ({
  color: theme.palette.icon.main, // Using the color from the theme
}));


const SymptomTable = ({ user }) => {
  const [symptomData, setSymptomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dynamicFields, setDynamicFields] = useState([]);

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setError('No user found');
      setLoading(false);
      return;
    }

    try {
      const [fields, data] = await Promise.all([
        fetchDynamicFields(user.uid),
        fetchSymptoms(user.uid)
      ]);
      setDynamicFields(fields);
      setSymptomData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo(() => ['timestamp', ...dynamicFields.map(field => field.title), 'actions'], [dynamicFields]);

  const formatCellValue = useCallback((value, column) => {
    if (column === 'timestamp') {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if (typeof value === 'boolean') { 
      return value ? 'Yes' : 'No';
    }
    return value !== undefined && value !== null ? value.toString() : '';
  }, []);

  const handleDelete = useCallback(async (symptomId) => {
    if (window.confirm('Are you sure you want to delete this symptom?')) {
      try {
        await deleteSymptom(user.uid, symptomId);
        setSymptomData(prevData => prevData.filter(symptom => symptom.id !== symptomId));
      } catch (err) {
        console.error('Error deleting symptom:', err);
        alert('Failed to delete symptom. Please try again.');
      }
    }
  }, [user?.uid]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (symptomData.length === 0) return <Typography>No symptom data available.</Typography>;

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>Table</Typography>
      <TableContainer component={Paper} sx={{ maxWidth: 1200, margin: 'auto', marginTop: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="symptom data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                  {column === 'actions' ? '' : column.charAt(0).toUpperCase() + column.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {symptomData.map((row) => (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === 'actions' ? (
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(row.id)} aria-label="delete">
                          <ColouredDeleteIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      formatCellValue(row[column], column)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(SymptomTable);
