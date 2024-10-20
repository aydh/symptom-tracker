import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress } from '@mui/material';
import { fetchDynamicFields } from '../utils/dynamicFieldsUtil';
import { fetchSymptomData } from '../utils/symptomUtils';

function SymptomTable({ user }) {
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
      // Fetch dynamic fields
      const fields = await fetchDynamicFields(user.uid);
      setDynamicFields(fields);

      // Fetch symptom data using the new utility function
      const data = await fetchSymptomData(user.uid);
      setSymptomData(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (symptomData.length === 0) return <Typography>No symptom data available.</Typography>;

  const columns = ['timestamp', ...dynamicFields.map(field => field.title)];

  const formatCellValue = (value, column) => {
    if (column === 'timestamp') {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if (typeof value === 'boolean') { 
      return value ? 'Yes' : 'No';
    }
    return value !== undefined && value !== null ? value.toString() : '';
  };

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 1200, margin: 'auto', marginTop: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="symptom data table">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {symptomData.map((row) => (
            <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              {columns.map((column) => (
                <TableCell key={column}>
                  {formatCellValue(row[column], column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SymptomTable;
