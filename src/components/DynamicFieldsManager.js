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
    try {
      await (field.id ? updateDynamicField : addDynamicField)(user.uid, field.id, field);
      loadFields();
    } catch (error) {
      console.error('Error saving field:', error);
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

export default React.memo(DynamicFieldsManager);
