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
import { fetchSymptoms } from '../utils/symptomUtils';

// Register ChartJS components
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

// Memoized component for rendering boolean fields
const BooleanFieldsList = React.memo(({ dynamicFields, toggledFields, onToggle }) => {
  // Filter boolean fields once
  const booleanFields = useMemo(() => 
    dynamicFields.filter(field => field.type === 'boolean'),
    [dynamicFields]
  );

  // Memoize the point style rendering function
  const renderPointStyle = useCallback((style, color) => {
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
  }, []);

  return (
    <Box sx={{ marginBottom: 2 }}>
      <List dense>
        {booleanFields.map((field) => (
          <ListItem key={field.title}>
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
                  checked={!!toggledFields[field.title]} // Ensure it's always a boolean
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
});

// Main SymptomAnalysis component
const SymptomAnalysis = ({ user }) => {
  const [symptomData, setSymptomData] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggledFields, setToggledFields] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setError('No user found');
      setLoading(false);
      return;
    }

    try {
      const [fields, data] = await Promise.all([
        fetchDynamicFields(user.uid),
        fetchSymptoms(user.uid)
      ]);
      setDynamicFields(fields);
      setSymptomData(data);

      // Initialize toggledFields here
      const initialToggledState = fields.reduce((acc, field) => {
        if (field.type === 'boolean') {
          acc[field.title] = true;
        }
        return acc;
      }, {});
      setToggledFields(initialToggledState);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching symptom data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Fetch data on component mount or when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle field handler
  const handleToggle = useCallback((fieldTitle) => {
    setToggledFields(prev => ({
      ...prev,
      [fieldTitle]: !prev[fieldTitle]
    }));
  }, []);

  // Prepare chart data
  const prepareChartData = useMemo(() => {
    if (symptomData.length === 0 || dynamicFields.length === 0) return [];

    const sortedData = symptomData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sortedData.map(entry => {
      const date = new Date(entry.timestamp);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    });

    const calculateMovingAverage = (data, windowSize) => {
      const result = [];
      for (let i = 0; i < data.length; i++) {
        if (i < windowSize - 1) {
          result.push(null);
        } else {
          const windowSum = data.slice(i - windowSize + 1, i + 1).reduce((sum, val) => sum + (Number(val) || 0), 0);
          result.push(windowSum / windowSize);
        }
      }
      return result;
    };

    return dynamicFields
      .filter(field => field.type !== 'boolean' && field.type !== 'text')
      .map(field => {
        const data = sortedData.map(entry => entry[field.title]);
        const movingAverageData = calculateMovingAverage(data, 5);

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
              borderColor: '#9900f6',
              borderWidth: 1,
              backgroundColor: 'rgb(153, 0, 246, 0.2)',
              fill: true,
              tension: 0.3,
              pointRadius: 2
            },
            {
              label: `5-Day Moving Average ${field.title}`,
              data: movingAverageData,
              borderColor: '#9900f6',
              borderWidth: 1,
              borderDash: [6, 6],
              fill: false,
              tension: 0.3,
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
  if (!isInitialized) return null; // Don't render anything until initialization is complete

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
};

// Export the memoized version of SymptomAnalysis
export default React.memo(SymptomAnalysis);
