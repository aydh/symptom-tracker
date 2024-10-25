import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  TextField, Select, MenuItem, Box, Typography, Switch, 
  FormControlLabel, FormControl, InputLabel, IconButton,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import enAU from 'date-fns/locale/en-AU';
import { fetchDynamicFields } from '../utils/dynamicFieldsUtil';
import { fetchSymptoms, addSymptom, updateSymptom } from '../utils/symptomUtils';
import { startOfDay, endOfDay, isSameDay, parseISO, addDays, subDays } from 'date-fns';
import { styled } from '@mui/material/styles';

const ColouredBackIcon = styled(ArrowBackIosNewIcon)(({ theme }) => ({
  color: theme.palette.icon.main, // Using the color from the theme
}));

const ColouredForwardIcon = styled(ArrowForwardIosIcon)(({ theme }) => ({
  color: theme.palette.icon.main, // Using the color from the theme
}));

function SymptomTracker({ user }) {
  const [symptom, setSymptom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const getDynamicFields = useCallback(async () => {
    try {
      const fields = await fetchDynamicFields(user.uid);
      setDynamicFields(fields);
    } catch (err) {
      console.error('Error fetching dynamic fields:', err);
    }
  }, [user.uid]);

  useEffect(() => {
    getDynamicFields();
  }, [getDynamicFields]);

  const parseTimestamp = useCallback((timestamp) => {
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') return parseISO(timestamp);
    if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
    console.error('Invalid timestamp format:', timestamp);
    return null;
  }, []);

  const getEntryForDate = useCallback(async (date) => {
    if (!user.uid) return;

    setIsLoading(true);
    try {
      const symptoms = await fetchSymptoms(user.uid);
      const matchingSymptom = symptoms.find(s => {
        const symptomDate = parseTimestamp(s.symptomDate);
        return symptomDate && isSameDay(symptomDate, date);
      });

      if (matchingSymptom) {
        setSymptom(matchingSymptom);
        const dynamicData = dynamicFields.reduce((acc, field) => {
          if (matchingSymptom[field.title] !== undefined) {
            acc[field.title] = matchingSymptom[field.title];
          }
          return acc;
        }, {});
        setDynamicValues(dynamicData);
      } else {
        setSymptom(null);
        setDynamicValues({});
      }
    } catch (err) {
      console.error('Error fetching symptoms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user.uid, dynamicFields, parseTimestamp]);

  useEffect(() => {
    getEntryForDate(selectedDate);
  }, [getEntryForDate, selectedDate]);

  const saveSymptom = useCallback(async (newValues) => {
    if (!user.uid) {
      console.error('User is not properly initialized');
      return;
    }

    setIsLoading(true);
    try {
      const symptomData = {
        symptomDate: startOfDay(selectedDate),
        ...newValues
      };

      if (symptom) {
        await updateSymptom(user.uid, symptom.id, symptomData);
      } else {
        const newSymptomId = await addSymptom(user.uid, symptomData);
        setSymptom({ id: newSymptomId, ...symptomData });
      }
      console.log('Symptom saved successfully');
    } catch (e) {
      console.error("Error saving symptom:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user.uid, symptom, selectedDate]);

  const handleDynamicFieldChange = useCallback((fieldTitle, value) => {
    setDynamicValues(prev => {
      const newValues = { ...prev, [fieldTitle]: value };
      saveSymptom(newValues);
      return newValues;
    });
  }, [saveSymptom]);

  const handleDateChange = useCallback((newDate) => {
    const today = new Date();
    if (newDate <= endOfDay(today)) {
      setSelectedDate(newDate);
    } else {
      console.log('Cannot select a future date');
    }
  }, []);

  const handlePreviousDay = useCallback(() => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(prevDate => {
      const nextDay = addDays(prevDate, 1);
      return nextDay <= new Date() ? nextDay : prevDate;
    });
  }, []);

  const sortedDynamicFields = useMemo(() => {
    return [...dynamicFields].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
      const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
      return orderA - orderB;
    });
  }, [dynamicFields]);

  const renderField = useCallback((field) => {
    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth key={field.id}>
            <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
            <Select
              id={field.id}
              value={dynamicValues[field.title] || ''}
              labelId={`${field.id}-label`}
              label={field.label}
              onChange={(e) => handleDynamicFieldChange(field.title, e.target.value)}
              fullWidth
            >
              <MenuItem value="" disabled>{`${field.label}`}</MenuItem>
              {field.values.map(value => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'text':
        return (
          <TextField
            key={field.id}
            id={field.id}
            value={dynamicValues[field.title] || ''}
            label={field.label}
            onChange={(e) => handleDynamicFieldChange(field.title, e.target.value)}
            fullWidth
            multiline={field.multiline}
            rows={field.multiline ? 4 : 1}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Switch
                checked={dynamicValues[field.title] || false}
                onChange={(e) => handleDynamicFieldChange(field.title, e.target.checked)}
                color="primary"
              />
            }
            label={field.label}
          />
        );
      default:
        return null;
    }
  }, [dynamicValues, handleDynamicFieldChange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, margin: 'auto', padding: 2 }}>
        <Typography variant="h4" gutterBottom>Track</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={handlePreviousDay} aria-label="previous day" disabled={isLoading}>
            <ColouredBackIcon />
          </IconButton>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            maxDate={new Date()}
            slotProps={{ textField: { sx: { width: '60%' } } }}
            slots={{
              textField: (params) => <TextField {...params} />
            }}
          />
          <IconButton 
            onClick={handleNextDay} 
            aria-label="next day"
            disabled={isLoading || isSameDay(selectedDate, new Date())}
          >
            <ColouredForwardIcon />
          </IconButton>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          sortedDynamicFields.map(renderField)
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default React.memo(SymptomTracker);
