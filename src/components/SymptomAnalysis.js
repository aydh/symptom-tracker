import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Stack, List, ListItem, ListItemIcon, ListItemText, Switch, FormControlLabel } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { fetchDynamicFields } from '../utils/dynamicFieldsUtil';
import { fetchSymptomData } from '../utils/symptomUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

function BooleanFieldsList({ dynamicFields, toggledFields, onToggle }) {
  const booleanFields = dynamicFields.filter(field => field.type === 'boolean');

  const renderPointStyle = (style, color) => {
    const size = 16;
    switch (style) {
      case 'circle':
        return <circle cx={size/2} cy={size/2} r={size/2} fill={color} />;
      case 'cross':
        return (
          <g stroke={color} strokeWidth="2">
            <line x1="0" y1="0" x2={size} y2={size} />
            <line x1="0" y1={size} x2={size} y2="0" />
          </g>
        );
      case 'crossRot':
        return (
          <g stroke={color} strokeWidth="2" transform={`rotate(45 ${size/2} ${size/2})`}>
            <line x1="0" y1="0" x2={size} y2={size} />
            <line x1="0" y1={size} x2={size} y2="0" />
          </g>
        );
      case 'dash':
        return <line x1="0" y1={size/2} x2={size} y2={size/2} stroke={color} strokeWidth="2" />;
      case 'line':
        return <line x1="0" y1={size/2} x2={size} y2={size/2} stroke={color} strokeWidth="2" />;
      case 'rect':
        return <rect width={size} height={size} fill={color} />;
      case 'rectRounded':
        return <rect width={size} height={size} rx="2" ry="2" fill={color} />;
      case 'rectRot':
        return <rect width={size} height={size} transform={`rotate(45 ${size/2} ${size/2})`} fill={color} />;
      case 'star':
        return (
          <polygon 
            points="8,0 10,6 16,6 11,10 13,16 8,12 3,16 5,10 0,6 6,6"
            fill={color}
          />
        );
      case 'triangle':
        return <polygon points={`${size/2},0 ${size},${size} 0,${size}`} fill={color} />;
      default:
        return <circle cx={size/2} cy={size/2} r={size/2} fill={color} />;
    }
  };

  return (
    <Box sx={{ marginBottom: 2 }}>
      <List dense>
        {booleanFields.map((field, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <svg width="16" height="16" viewBox="0 0 16 16">
                {renderPointStyle(field.pointStyle || 'star', field.pointColor || 'red')}
              </svg>
            </ListItemIcon>
            <ListItemText 
              primary={field.title}
              secondary={`Style: ${field.pointStyle || 'star'}`}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={toggledFields[field.title]}
                  onChange={() => onToggle(field.title)}
                  name={field.title}
                />
              }
              label="Show"
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

function SymptomAnalysis({ user }) {
  const [symptomData, setSymptomData] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggledFields, setToggledFields] = useState({});

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setError('No user found');
      setLoading(false);
      return;
    }

    try {
      const fields = await fetchDynamicFields(user.uid);
      setDynamicFields(fields);

      const data = await fetchSymptomData(user.uid);
      setSymptomData(data);
    } catch (err) {
      setError('Error fetching symptom data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Initialize all boolean fields as toggled on
    if (dynamicFields.length > 0) {
      const initialToggledState = {};
      dynamicFields.forEach(field => {
        if (field.type === 'boolean') {
          initialToggledState[field.title] = true;
        }
      });
      setToggledFields(initialToggledState);
    }
  }, [dynamicFields]);

  const handleToggle = (fieldTitle) => {
    setToggledFields(prev => ({
      ...prev,
      [fieldTitle]: !prev[fieldTitle]
    }));
  };

  const prepareChartData = useMemo(() => {
    if (symptomData.length === 0 || dynamicFields.length === 0) return [];

    const sortedData = symptomData.sort((a, b) => {
      const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp);
      return dateA - dateB;
    });

    const labels = sortedData.map(entry => {
      const date = entry.timestamp?.toDate?.() || new Date(entry.timestamp);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    });

    const calculateMovingAverage = (data, windowSize) => {
      return data.map((_, index, array) => {
        if (index < windowSize - 1) {
          return null; // Not enough data for the full window
        }
        const window = array.slice(index - windowSize + 1, index + 1);
        const sum = window.reduce((acc, val) => acc + (Number(val) || 0), 0);
        return sum / windowSize;
      });
    };

    return dynamicFields
      .filter(field => field.type !== 'boolean' && field.type !== 'text')
      .map(field => {
        const data = sortedData.map(entry => entry[field.title]);
        const movingAverageData = calculateMovingAverage(data, 5);
        const sum = data.reduce((acc, val) => acc + (Number(val) || 0), 0);
        const avg = sum / data.length;

        const booleanAnnotations = dynamicFields
          .filter(bField => bField.type === 'boolean' && toggledFields[bField.title])
          .flatMap(bField => 
            sortedData.map((entry, index) => ({
              type: 'point',
              xValue: index,
              yValue: entry[field.title],
              backgroundColor: bField.pointColor || 'red',
              borderColor: bField.pointColor || 'red',
              borderWidth: 2,
              radius: 6,
              pointStyle: ['circle', 'cross', 'crossRot', 'dash', 'line', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle'].includes(bField.pointStyle) 
                ? bField.pointStyle 
                : 'star',
              display: entry[bField.title] === true
            }))
          );

        return {
          attribute: field.title,
          labels,
          datasets: [
            {
              label: `Daily ${field.title}`,
              data,
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
              tension: 0.3,
              pointRadius: 3
            },
            {
              label: `5-Day Moving Average ${field.title}`,
              data: movingAverageData,
              borderColor: 'rgb(255, 159, 64)',
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              pointRadius: 0
            },
            {
              label: `Average ${field.title}`,
              data: Array(labels.length).fill(avg),
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1,
              borderDash: [5, 5],
              fill: false,
              tension: 0,
              pointRadius: 0
            }
          ],
          options: {
            plugins: {
              annotation: {
                annotations: booleanAnnotations
              }
            }
          }
        };
      });
  }, [symptomData, dynamicFields, toggledFields]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (prepareChartData.length === 0) return <Typography>No symptom data available for analysis.</Typography>;

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>Analyse</Typography>
      
      <BooleanFieldsList 
        dynamicFields={dynamicFields} 
        toggledFields={toggledFields} 
        onToggle={handleToggle}
      />

      <Stack spacing={3} direction={{ xs: 'column', md: 'row' }} flexWrap="wrap">
        {prepareChartData.map((data, index) => (
          <Box key={index} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' }, marginBottom: 4 }}>
            <Typography variant="h6" gutterBottom>{data.attribute} Trend</Typography>
            <Line 
              data={{
                labels: data.labels,
                datasets: data.datasets
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: {
                    display: true,
                    text: `${data.attribute} Over Time`
                  },
                  tooltip: {
                    callbacks: {
                      afterBody: (context) => {
                        const dataIndex = context[0].dataIndex;
                        const entry = symptomData[dataIndex];
                        return dynamicFields
                          .filter(field => field.type === 'boolean' && entry[field.title])
                          .map(field => `${field.title}: Yes`);
                      }
                    }
                  },
                  annotation: {
                    annotations: data.options?.plugins?.annotation?.annotations || []
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        if (Math.floor(value) === value) {
                          return value;
                        }
                      }
                    }
                  }
                }
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default SymptomAnalysis;
