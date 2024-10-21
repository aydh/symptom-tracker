import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  TextField, Select, MenuItem, Box, Typography, Switch, 
  FormControlLabel, FormControl, InputLabel, IconButton 
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import enAU from 'date-fns/locale/en-AU';
import { fetchDynamicFields } from '../utils/dynamicFieldsUtil';
import { fetchSymptoms, addSymptom, updateSymptom } from '../utils/symptomUtils';
import { startOfDay, endOfDay, isSameDay, parseISO, addDays, subDays } from 'date-fns';

function SymptomTracker({ user }) {
  const [symptom, setSymptom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});

  const getDynamicFields = useCallback(async () => {
    try {
      const fields = await fetchDynamicFields(user.uid);
      setDynamicFields(fields);
    } catch (err) {
      console.error('Error fetching dynamic fields:', err);
    }
  }, [user]);

  useEffect(() => {
    getDynamicFields();
  }, [getDynamicFields]);

  const getEntryForDate = useCallback(async (date) => {
    if (!user || !user.uid) return;

    try {
      const symptoms = await fetchSymptoms(user.uid);
      const matchingSymptom = symptoms.find(s => {
        let symptomDate;
        if (s.timestamp instanceof Date) {
          symptomDate = s.timestamp;
        } else if (typeof s.timestamp === 'string') {
          symptomDate = parseISO(s.timestamp);
        } else if (s.timestamp && typeof s.timestamp.toDate === 'function') {
          symptomDate = s.timestamp.toDate();
        } else {
          console.error('Invalid timestamp format:', s.timestamp);
          return false;
        }
        return isSameDay(symptomDate, date);
      });

      if (matchingSymptom) {
        setSymptom(matchingSymptom);
        const dynamicData = {};
        dynamicFields.forEach(field => {
          if (matchingSymptom[field.title] !== undefined) {
            dynamicData[field.title] = matchingSymptom[field.title];
          }
        });
        setDynamicValues(dynamicData);
      } else {
        setSymptom(null);
        setDynamicValues({});
      }
    } catch (err) {
      console.error('Error fetching symptoms:', err);
    }
  }, [user, dynamicFields]);

  useEffect(() => {
    getEntryForDate(selectedDate);
  }, [getEntryForDate, selectedDate]);

  const saveSymptom = useCallback(async () => {
    if (!user || !user.uid) {
      console.error('User is not properly initialized');
      return;
    }

    try {
      const symptomData = {
        timestamp: startOfDay(selectedDate),
        ...dynamicValues
      };

      if (symptom) {
        await updateSymptom(user.uid, symptom.id, symptomData);
      } else {
        const newSymptomId = await addSymptom(user.uid, symptomData);
        setSymptom({ id: newSymptomId, ...symptomData });
      }
    } catch (e) {
      console.error("Error saving symptom:", e);
    }
  }, [user, symptom, selectedDate, dynamicValues]);

  const handleDynamicFieldChange = (fieldTitle, value) => {
    setDynamicValues(prev => ({
      ...prev,
      [fieldTitle]: value
    }));
  };

  const handleDateChange = (newDate) => {
    const today = new Date();
    
    if (newDate <= endOfDay(today)) {
      setSelectedDate(newDate);
    } else {
      console.log('Cannot select a future date');
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.keys(dynamicValues).length > 0) {
        saveSymptom();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [saveSymptom, dynamicValues]);

  const sortedDynamicFields = useMemo(() => {
    return [...dynamicFields].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
      const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
      return orderA - orderB;
    });
  }, [dynamicFields]);

  const handlePreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (nextDay <= new Date()) {
      setSelectedDate(nextDay);
    } else {
      console.log('Cannot select a future date');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, margin: 'auto', padding: 2 }}>
        <Typography variant="h4" gutterBottom>Track</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={handlePreviousDay} aria-label="previous day">
            <ArrowBackIosNewIcon />
          </IconButton>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} sx={{ width: '60%' }} />}
          />
          <IconButton 
            onClick={handleNextDay} 
            aria-label="next day"
            disabled={isSameDay(selectedDate, new Date())}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
        {sortedDynamicFields.map((field) => (
          <Box key={field.id}>
            {field.type === 'select' ? (
              <FormControl fullWidth>
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
            ) : field.type === 'text' ? (
              <TextField
                id={field.id}
                value={dynamicValues[field.title] || ''}
                label={field.label}
                onChange={(e) => handleDynamicFieldChange(field.title, e.target.value)}
                fullWidth
                multiline={field.multiline}
                rows={field.multiline ? 4 : 1}
              />
            ) : field.type === 'boolean' ? (
              <FormControlLabel
                id={field.id}
                control={
                  <Switch
                    checked={dynamicValues[field.title] || false}
                    onChange={(e) => handleDynamicFieldChange(field.title, e.target.checked)}
                    color="primary"
                  />
                }
                label={field.label}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </LocalizationProvider>
  );
}

export default SymptomTracker;
