import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TextField, Select, MenuItem, Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';

function SymptomTracker({ user }) {
  const [docId, setDocId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dynamicFields, setDynamicFields] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});

  // Fetch dynamic fields from Firestore
  const fetchDynamicFields = useCallback(async () => {
    const fieldsSnapshot = await getDocs(collection(db, 'dynamicFields'));
    const fields = fieldsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort fields based on the order attribute
    const sortedFields = fields.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
      const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
      return orderA - orderB;
    });
    
    setDynamicFields(sortedFields);
  }, []);

  useEffect(() => {
    fetchDynamicFields();
  }, [fetchDynamicFields]);

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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, margin: 'auto' }}>
        <Box>
          <Typography variant="subtitle1">Date</Typography>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            renderInput={(params) => <TextField {...params} />}
            maxDate={new Date()} // This prevents selecting future dates in the calendar
          />
        </Box>
        {sortedDynamicFields.map((field) => (
          <Box key={field.id}>
            <Typography variant="subtitle1">{field.title}</Typography>
            {field.type === 'select' ? (
              <Select
                value={dynamicValues[field.title] || ''}
                onChange={(e) => handleDynamicFieldChange(field.title, e.target.value)}
                fullWidth
              >
                <MenuItem value="" disabled>{`Select ${field.title.toLowerCase()}`}</MenuItem>
                {field.values.map(value => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </Select>
            ) : field.type === 'text' ? (
              <TextField
                value={dynamicValues[field.title] || ''}
                onChange={(e) => handleDynamicFieldChange(field.title, e.target.value)}
                fullWidth
                multiline={field.multiline}
                rows={field.multiline ? 4 : 1}
              />
            ) : field.type === 'boolean' ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={dynamicValues[field.title] || false}
                    onChange={(e) => handleDynamicFieldChange(field.title, e.target.checked)}
                    color="primary"
                  />
                }
                label={field.title}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </LocalizationProvider>
  );
}

export default SymptomTracker;
