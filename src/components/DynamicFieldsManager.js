import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Select, MenuItem, 
  FormControl, Switch, FormControlLabel, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { fetchDynamicFields, addDynamicField, updateDynamicField, deleteDynamicField } from '../utils/dynamicFieldsUtil';

const FieldRow = React.memo(({ field, index, onInputChange, onSave, onDelete }) => {
  const handleChange = useCallback((name, value) => {
    onInputChange(index, name, value);
  }, [index, onInputChange]);

  return (
    <TableRow>
      <TableCell>
        <TextField
          name="title"
          value={field.title}
          onChange={(e) => handleChange('title', e.target.value)}
          fullWidth
        />
      </TableCell>
      <TableCell>
        <TextField
          name="label"
          value={field.label}
          onChange={(e) => handleChange('label', e.target.value)}
          fullWidth
        />
      </TableCell>
      <TableCell>
        <FormControl fullWidth>
          <Select
            name="type"
            value={field.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="select">Select</MenuItem>
          </Select>
        </FormControl>
      </TableCell>
      <TableCell>
        <TextField
          name="order"
          type="number"
          value={field.order}
          onChange={(e) => handleChange('order', Number(e.target.value))}
          fullWidth
        />
      </TableCell>
      <TableCell>
        {field.type === 'text' && (
          <FormControlLabel
            control={
              <Switch 
                name="multiline" 
                checked={field.multiline} 
                onChange={(e) => handleChange('multiline', e.target.checked)}
              />
            }
            label="Multiline"
          />
        )}
        {field.type === 'boolean' && (
          <>
            <TextField
              name="pointColor"
              value={field.pointColor}
              onChange={(e) => handleChange('pointColor', e.target.value)}
              placeholder="Point Color"
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              name="pointStyle"
              value={field.pointStyle}
              onChange={(e) => handleChange('pointStyle', e.target.value)}
              placeholder="Point Style"
              fullWidth
            />
          </>
        )}
        {field.type === 'select' && (
          <TextField
            name="values"
            value={field.values.join(',')}
            onChange={(e) => handleChange('values', e.target.value.split(','))}
            placeholder="Values (comma-separated)"
            fullWidth
          />
        )}
      </TableCell>
      <TableCell>
        <IconButton onClick={() => onSave(index)}><SaveIcon /></IconButton>
        {field.id && <IconButton onClick={() => onDelete(field.id)}><DeleteIcon /></IconButton>}
      </TableCell>
    </TableRow>
  );
});

const DynamicFieldsManager = ({ user }) => {
  const [fields, setFields] = useState([]);

  const loadFields = useCallback(async () => {
    if (!user?.uid) {
      console.error('No user ID available');
      return;
    }
    try {
      const fetchedFields = await fetchDynamicFields(user.uid);
      setFields(fetchedFields);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadFields();
    }
  }, [user?.uid, loadFields]);

  const handleInputChange = useCallback((index, name, value) => {
    setFields(prevFields => {
      const newFields = [...prevFields];
      newFields[index] = { ...newFields[index], [name]: value };
      return newFields;
    });
  }, []);

  const handleSaveField = useCallback(async (index) => {
    const field = fields[index];
    if (!user?.uid) {
      console.error('No user ID available');
      return;
    }
    try {
      if (field.id) {
        await updateDynamicField(user.uid, field.id, field);
      } else {
        await addDynamicField(user.uid, field);
      }
      loadFields();
    } catch (error) {
      console.error('Error saving field:', error);
    }
  }, [fields, user?.uid, loadFields]);

  const handleDeleteField = useCallback(async (fieldId) => {
    if (!user?.uid) {
      console.error('No user ID available');
      return;
    }
    try {
      await deleteDynamicField(user.uid, fieldId);
      loadFields();
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  }, [user?.uid, loadFields]);

  const handleAddNewRow = useCallback(() => {
    setFields(prevFields => [...prevFields, {
      title: '',
      label: '',
      type: 'text',
      order: '',
      multiline: false,
      pointColor: '',
      pointStyle: '',
      values: []
    }]);
  }, []);

  const tableHeaders = useMemo(() => [
    'Title', 'Label', 'Type', 'Order', 'Additional Settings', 'Actions'
  ], []);

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>Configure</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {tableHeaders.map(header => (
                <TableCell key={header}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <FieldRow 
                key={field.id || `new-${index}`}
                field={field}
                index={index}
                onInputChange={handleInputChange}
                onSave={handleSaveField}
                onDelete={handleDeleteField}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" onClick={handleAddNewRow} sx={{ mt: 2 }}>
        Add New Field
      </Button>
    </Box>
  );
};

export default React.memo(DynamicFieldsManager);
