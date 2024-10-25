import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, 
  FormControl, Switch, FormControlLabel, Card, CardContent, 
  CardActions, Stack, IconButton, InputLabel, InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { fetchDynamicFields, addDynamicField, updateDynamicField, deleteDynamicField } from '../utils/dynamicFieldsUtils';
import { pointStyleLookup, renderPointStyle } from '../utils/flagStyleUtils';

const IconWrapper = ({ children, onClick }) => (
  <IconButton onClick={onClick} size="small">
    {children}
  </IconButton>
);

const FormField = React.memo(({ name, label, value, onChange, type = 'text', ...props }) => (
  <TextField
    name={name}
    label={label}
    value={value}
    onChange={(e) => onChange(name, e.target.value)}
    type={type}
    fullWidth
    margin="dense"
    {...props}
  />
));

const SelectField = React.memo(({ name, label, value, onChange, options }) => (
  <FormControl fullWidth margin="dense">
    <InputLabel>{label}</InputLabel>
    <Select
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      label={label}
    >
      {options.map(({ value, label }) => (
        <MenuItem key={value} value={value}>{label}</MenuItem>
      ))}
    </Select>
  </FormControl>
));

const ColorSelector = React.memo(({ value, onChange, label }) => (
  <TextField
    label={label}
    value={value}
    onChange={(e) => onChange('pointColor', e.target.value)}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange('pointColor', e.target.value)}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              background: 'none',
            }}
          />
        </InputAdornment>
      ),
    }}
    fullWidth
    margin="dense"
  />
));

const BooleanFieldOptions = React.memo(({ field, index, onChange }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
    <Box flex={1} minWidth={150}>
      <ColorSelector
        value={field.pointColor}
        onChange={onChange}
        label="Point Color"
      />
    </Box>
    <Box flex={1} minWidth={150}>
      <SelectField
        name="pointStyle"
        label="Point Style"
        value={field.pointStyle || ''}
        onChange={onChange}
        options={Object.keys(pointStyleLookup).map(style => ({
          value: style,
          label: (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: 8 }}>
                {renderPointStyle(style, field.pointColor || 'currentColor')}
              </svg>
              {style}
            </Box>
          )
        }))}
      />
    </Box>
  </Stack>
));

const FieldCard = React.memo(({ field, index, onInputChange, onSave, onDelete }) => {
  const handleChange = useCallback((name, value) => {
    onInputChange(index, name, value);
  }, [index, onInputChange]);

  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'select', label: 'Select' },
    { value: 'slider', label: 'Slider' }
  ];

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }} useFlexGap flexWrap="wrap">
          <Box flex={1} minWidth={150}>
            <FormField name="title" label="Title" value={field.title} onChange={handleChange} />
          </Box>
          <Box flex={2} minWidth={250}>
            <FormField name="label" label="Label" value={field.label} onChange={handleChange} />
          </Box>
          <Box flex={1} minWidth={120}>
            <SelectField name="type" label="Type" value={field.type} onChange={handleChange} options={fieldTypeOptions} />
          </Box>
          <Box flex={1} minWidth={80}>
            <FormField name="order" label="Order" value={field.order} onChange={handleChange} type="number" />
          </Box>
          <Box flex={2}  minWidth={320}>
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
              <BooleanFieldOptions field={field} index={index} onChange={handleChange} />
            )}
            {field.type === 'select' && (
              <FormField
                name="values"
                label="Values (comma-separated)"
                value={field.values.join(',')}
                onChange={(name, value) => handleChange(name, value.split(','))}
              />
            )}
            {field.type === 'slider' && (
              <Stack direction="row" spacing={1}>
                <Box flex={1} minWidth={80}>
                  <FormField name="minimum" label="Minimum" value={field.minimum} onChange={handleChange} />
                </Box>
                <Box flex={1} minWidth={80}>
                  <FormField name="maximum" label="Maximum" value={field.maximum} onChange={handleChange} />
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
      <CardActions>
        <IconWrapper onClick={() => onSave(index)}><SaveIcon color="primary" /></IconWrapper>
        {field.id && <IconWrapper onClick={() => onDelete(field.id)}><DeleteIcon color="primary" /></IconWrapper>}
      </CardActions>
    </Card>
  );
});

const DynamicFieldsManager = ({ user }) => {
  const [fields, setFields] = useState([]);

  const loadFields = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const fetchedFields = await fetchDynamicFields(user.uid);
      setFields(fetchedFields);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) loadFields();
  }, [user?.uid, loadFields]);

  const handleInputChange = useCallback((index, name, value) => {
    setFields(prevFields => prevFields.map((field, i) => 
      i === index ? { ...field, [name]: value } : field
    ));
  }, []);

  const handleSaveField = useCallback(async (index) => {
    if (!user?.uid) return;
    const field = fields[index];
    
    // Validate field data before saving
    if (!isValidField(field)) {
      console.error('Invalid field data:', field);
      // You might want to show an error message to the user here
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
      // You might want to show an error message to the user here
    }
  }, [fields, user?.uid, loadFields]);

  const handleDeleteField = useCallback(async (fieldId) => {
    if (!user?.uid) return;
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
      minimum: '',
      maximum: '',
      values: []
    }]);
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>Configure</Typography>
      {fields.map((field, index) => (
        <FieldCard 
          key={field.id || `new-${index}`}
          field={field}
          index={index}
          onInputChange={handleInputChange}
          onSave={handleSaveField}
          onDelete={handleDeleteField}
        />
      ))}
      <Button variant="contained" onClick={handleAddNewRow} sx={{ mt: 2 }}>
        Add New Field
      </Button>
    </Box>
  );
};

// Helper function to validate field data
const isValidField = (field) => {
  const requiredFields = ['title', 'label', 'type', 'order'];
  for (const key of requiredFields) {
    if (!field[key] && field[key] !== 0) {
      console.error(`Missing required field: ${key}`);
      return false;
    }
  }

  // Ensure order is a number
  field.order = Number(field.order);
  if (isNaN(field.order)) {
    console.error('Order must be a number');
    return false;
  }

  // Additional type-specific validations
  switch (field.type) {
    case 'select':
      if (!Array.isArray(field.values)) {
        console.error('Select field values must be an array');
        return false;
      }
      if (field.values.length === 0) {
        console.error('Select field must have at least one value');
        return false;
      }
      break;
    case 'slider':
      field.minimum = Number(field.minimum);
      field.maximum = Number(field.maximum);
      if (isNaN(field.minimum) || isNaN(field.maximum)) {
        console.error('Slider minimum and maximum must be numbers');
        return false;
      }
      if (field.minimum >= field.maximum) {
        console.error('Slider minimum must be less than maximum');
        return false;
      }
      break;
    case 'boolean':
      if (typeof field.pointColor !== 'string' || typeof field.pointStyle !== 'string') {
        console.error('Boolean field must have valid pointColor and pointStyle');
        return false;
      }
      break;
    case 'text':
      // No additional validation needed for text fields
      break;
    default:
      console.error(`Unknown field type: ${field.type}`);
      return false;
  }

  return true;
};

export default React.memo(DynamicFieldsManager);
