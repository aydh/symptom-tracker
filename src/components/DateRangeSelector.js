import React from 'react';
import { Box, Button, ButtonGroup, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const DateRangeSelector = ({ startDate, endDate, onDateChange }) => {
  const presets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ];

  const handlePresetClick = (days) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days));
    onDateChange(start, end);
  };

  const handleStartDateChange = (newDate) => {
    onDateChange(startOfDay(newDate), endDate);
  };

  const handleEndDateChange = (newDate) => {
    onDateChange(startDate, endOfDay(newDate));
  };

  return (
    <Box sx={{ mb: 3 }}>
      <ButtonGroup sx={{ mb: 2 }} variant="outlined" size="small">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </ButtonGroup>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={handleStartDateChange}
          maxDate={endDate}
          renderInput={(params) => <TextField {...params} size="small" />}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={handleEndDateChange}
          minDate={startDate}
          maxDate={new Date()}
          renderInput={(params) => <TextField {...params} size="small" />}
        />
      </Box>
    </Box>
  );
};

export default DateRangeSelector; 