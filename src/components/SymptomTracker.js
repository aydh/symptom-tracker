import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TextField, Select, MenuItem, Box, Typography, Switch, FormControlLabel, FormControl, InputLabel } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import enAU from 'date-fns/locale/en-AU';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { fetchDynamicFields } from '../utils/dynamicFieldsUtil';

function SymptomTracker({ user }) {
  const [docId, setDocId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});

  // Fetch dynamic fields from Firestore
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

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "symptoms"),
      where("userId", "==", user.uid),
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<=", endOfDay)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      setDocId(doc.id);
      const dynamicData = {};
      dynamicFields.forEach(field => {
        if (doc.data()[field.title] !== undefined) {
          dynamicData[field.title] = doc.data()[field.title];
        }
      });
      setDynamicValues(dynamicData);
    } else {
      setDocId(null);
      setDynamicValues({});
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
        timestamp: selectedDate,
        ...dynamicValues
      };

      if (docId) {
        await updateDoc(doc(db, "symptoms", docId), symptomData);
      } else {
        const docRef = await addDoc(collection(db, "symptoms"), {
          userId: user.uid,
          ...symptomData
        });
        setDocId(docRef.id);
      }
    } catch (e) {
      console.error("Error saving document: ", e);
    }
  }, [user, docId, selectedDate, dynamicValues]);

  const handleDynamicFieldChange = (fieldTitle, value) => {
    setDynamicValues(prev => ({
      ...prev,
      [fieldTitle]: value
    }));
  };

  const handleDateChange = (newDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newDate <= today) {
      setSelectedDate(newDate);
    } else {
      console.log('Cannot select a future date');
      // Optionally, you can show a user-friendly message here
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, margin: 'auto', padding: 2 }}>
        <Typography variant="h4" gutterBottom>Track</Typography>
        <Box>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            maxDate={new Date()}
            sx={{ width: '100%' }}
            textField={(params) => <TextField {...params} fullWidth />}
          />
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
