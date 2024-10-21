import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Button, TextField, Select, MenuItem, 
  FormControl, Switch, FormControlLabel, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { fetchDynamicFields, addDynamicField, updateDynamicField, deleteDynamicField } from '../utils/dynamicFieldsUtil';

const DynamicFieldsManager = ({ user }) => {
  const [fields, setFields] = useState([]);

  const loadFields = useCallback(async () => {
    if (!user || !user.uid) {
      console.error('No user ID available');
      return;
    }
    try {
      const fetchedFields = await fetchDynamicFields(user.uid);
      setFields(fetchedFields);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.uid) {
      loadFields();
    }
  }, [user, loadFields]);

  const handleInputChange = (index, name, value) => {
    setFields(prevFields => {
      const newFields = [...prevFields];
      newFields[index] = { ...newFields[index], [name]: value };
      return newFields;
    });
  };

  const handleSaveField = async (index) => {
    const field = fields[index];
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
  };

  const handleDeleteField = async (fieldId) => {
    if (!user || !user.uid) {
      console.error('No user ID available');
      return;
    }
    try {
      await deleteDynamicField(user.uid, fieldId);
      loadFields();
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  const handleAddNewRow = () => {
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
  };

  const renderFieldRow = (field, index) => {
    return (
      <TableRow key={field.id || `new-${index}`}>
        <TableCell>
          <TextField
            name="title"
            value={field.title}
            onChange={(e) => handleInputChange(index, 'title', e.target.value)}
            fullWidth
          />
        </TableCell>
        <TableCell>
          <TextField
            name="label"
            value={field.label}
            onChange={(e) => handleInputChange(index, 'label', e.target.value)}
            fullWidth
          />
        </TableCell>
        <TableCell>
          <FormControl fullWidth>
            <Select
              name="type"
              value={field.type}
              onChange={(e) => handleInputChange(index, 'type', e.target.value)}
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
            onChange={(e) => handleInputChange(index, 'order', Number(e.target.value))}
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
                  onChange={(e) => handleInputChange(index, 'multiline', e.target.checked)}
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
                onChange={(e) => handleInputChange(index, 'pointColor', e.target.value)}
                placeholder="Point Color"
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                name="pointStyle"
                value={field.pointStyle}
                onChange={(e) => handleInputChange(index, 'pointStyle', e.target.value)}
                placeholder="Point Style"
                fullWidth
              />
            </>
          )}
          {field.type === 'select' && (
            <TextField
              name="values"
              value={field.values.join(',')}
              onChange={(e) => handleInputChange(index, 'values', e.target.value.split(','))}
              placeholder="Values (comma-separated)"
              fullWidth
            />
          )}
        </TableCell>
        <TableCell>
          <IconButton onClick={() => handleSaveField(index)}><SaveIcon /></IconButton>
          {field.id && <IconButton onClick={() => handleDeleteField(field.id)}><DeleteIcon /></IconButton>}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Manage Dynamic Fields</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Additional Settings</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => renderFieldRow(field, index))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" onClick={handleAddNewRow} sx={{ mt: 2 }}>
        Add New Field
      </Button>
    </Box>
  );
};

export default DynamicFieldsManager;
