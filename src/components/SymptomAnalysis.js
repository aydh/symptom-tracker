import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function SymptomAnalysis({ user }) {
  const [symptomData, setSymptomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSymptomData = useCallback(async () => {
    if (!user || !user.uid) {
      console.log('No user found');
      setError('No user found');
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "symptoms"),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Fetched data:', data);
      setSymptomData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching symptom data:', err);
      setError('Error fetching symptom data');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSymptomData();
  }, [fetchSymptomData]);

  const prepareChartData = useCallback(() => {
    console.log('Preparing chart data. Symptom data:', symptomData);

    if (symptomData.length === 0) {
      console.log('No symptom data available');
      return [];
    }

    const sortedData = symptomData.sort((a, b) => {
      const dateA = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const dateB = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return dateA - dateB;
    });

    console.log('Sorted data:', sortedData);

    const labels = sortedData.map(entry => {
      const date = entry.timestamp && entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp);
      return date.toLocaleDateString();
    });

    console.log('Labels:', labels);

    const attributes = {};
    const categoryData = {};

    sortedData.forEach((entry, index) => {
      Object.entries(entry).forEach(([key, value]) => {
        if (key !== 'timestamp' && key !== 'userId' && key !== 'id') {
          if (typeof value === 'number' || !isNaN(parseFloat(value))) {
            const numericValue = typeof value === 'number' ? value : parseFloat(value);
            if (!attributes[key]) {
              attributes[key] = {
                data: [],
                sum: 0,
                count: 0
              };
              categoryData[key] = [];
            }
            attributes[key].data.push(numericValue);
            attributes[key].sum += numericValue;
            attributes[key].count += 1;
            categoryData[key].push(sortedData[index]);
          } else {
            console.log(`Skipping non-numeric value for ${key}:`, value);
          }
        }
      });
    });

    console.log('Processed attributes:', attributes);
    console.log('Category data:', categoryData);

    const chartData = Object.entries(attributes).map(([key, attr]) => ({
      attribute: key,
      labels,
      datasets: [
        {
          label: `Daily ${key}`,
          data: attr.data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: `Average ${key}`,
          data: Array(labels.length).fill(attr.sum / attr.count),
          fill: false,
          borderColor: 'rgb(255, 99, 132)',
          borderDash: [5, 5],
          pointRadius: 0
        }
      ],
      categoryData: categoryData[key]
    }));

    console.log('Final chart data:', chartData);
    return chartData;
  }, [symptomData]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const chartData = prepareChartData();

  if (chartData.length === 0) {
    return <Typography>No symptom data available for analysis.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>Symptom Analysis</Typography>
      
      <Grid container spacing={3}>
        {chartData.map((data, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box sx={{ marginBottom: 4 }}>
              <Typography variant="h6" gutterBottom>{data.attribute} Trend</Typography>
              <Line 
                data={{
                  labels: data.labels,
                  datasets: data.datasets
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: `${data.attribute} Over Time`
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += context.parsed.y;
                          }
                          return label;
                        },
                        afterBody: function(context) {
                          const dataIndex = context[0].dataIndex;
                          const categoryInfo = data.categoryData[dataIndex];
                          if (categoryInfo) {
                            return Object.entries(categoryInfo)
                              .filter(([key]) => key !== 'timestamp' && key !== 'userId' && key !== 'id')
                              .map(([key, value]) => `${key}: ${value}`);
                          }
                          return [];
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default SymptomAnalysis;
