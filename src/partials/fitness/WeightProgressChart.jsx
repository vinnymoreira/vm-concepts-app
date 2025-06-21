import React, { useRef, useEffect, useState } from 'react';
import { useThemeProvider } from '../../utils/ThemeContext';
import { chartColors } from '../../charts/ChartjsConfig';

import {
  Chart, LineController, LineElement, Filler, PointElement, 
  LinearScale, CategoryScale, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(
  LineController, 
  LineElement, 
  Filler, 
  PointElement, 
  LinearScale, 
  CategoryScale,
  TimeScale,
  Tooltip, 
  Legend
);

const WeightProgressChart = ({ goal, weightLogs }) => {
  const [chart, setChart] = useState(null);
  const canvas = useRef(null);
  const { currentTheme } = useThemeProvider();
  const darkMode = currentTheme === 'dark';
  const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors;

  const prepareChartData = () => {
    if (!goal || weightLogs.length === 0) return null;

    const sortedLogs = [...weightLogs].sort((a, b) => 
      new Date(a.log_date) - new Date(b.log_date)
    );

    const projectedData = [];
    if (sortedLogs.length >= 2) {
      projectedData.push({
        x: sortedLogs[sortedLogs.length - 1].log_date,
        y: sortedLogs[sortedLogs.length - 1].weight
      });
      projectedData.push({
        x: goal.deadline,
        y: goal.target_weight
      });
    }

    const formatDateForTooltip = (dateString) => {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'
      });
    };

    return {
      labels: sortedLogs.map(log => log.log_date),
      datasets: [
        {
          label: 'Weight',
          data: sortedLogs.map(log => ({
            x: log.log_date,
            y: log.weight,
            originalDate: log.log_date,
            formattedDate: formatDateForTooltip(log.log_date)
          })),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        },
        ...(projectedData.length > 0 ? [{
          label: 'Projected Path',
          data: projectedData,
          borderColor: '#F59E0B',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          tension: 0.1
        }] : [])
      ]
    };
  };

  // Generate monthly labels from start to target date
  const generateMonthlyLabels = () => {
    if (!goal || weightLogs.length === 0) return [];

    const sortedLogs = [...weightLogs].sort((a, b) => 
      new Date(a.log_date) - new Date(b.log_date)
    );

    const startDate = new Date(sortedLogs[0].log_date + 'T00:00:00');
    const endDate = new Date(goal.deadline + 'T00:00:00');

    const monthlyLabels = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (current <= endDate) {
      const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
      monthlyLabels.push({
        date: new Date(current),
        label: current.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        monthKey: monthKey
      });
      current.setMonth(current.getMonth() + 1);
    }

    return monthlyLabels;
  };

  // Calculate axis bounds
  const getAxisBounds = () => {
    if (!goal || weightLogs.length === 0) return {};

    const sortedLogs = [...weightLogs].sort((a, b) => 
      new Date(a.log_date) - new Date(b.log_date)
    );

    const startDate = new Date(sortedLogs[0].log_date + 'T00:00:00');
    const endDate = new Date(goal.deadline + 'T00:00:00');

    // Set min to the first day of the starting month
    const minDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    // Set max to extend beyond the target month to ensure the final month label appears at the end
    const maxDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 10);

    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const ctx = canvas.current;
    if (!ctx || !goal || weightLogs.length === 0) return;

    const data = prepareChartData();
    if (!data) return;

    // Destroy existing chart
    if (chart) {
      chart.destroy();
    }

    const monthlyLabels = generateMonthlyLabels();
    const axisBounds = getAxisBounds();

    const newChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 20
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                return context[0].raw.formattedDate || context[0].raw.originalDate;
              },
              label: function(context) {
                const label = context.dataset.label || '';
                
                if (label === 'Target Weight' || label === 'Projected Path') {
                  return null;
                }
                
                return `${label}: ${context.parsed.y} lbs`;
              },
              afterLabel: function(context) {
                if (context.dataset.label === 'Weight') {
                  return `Target: ${goal.target_weight} lbs`;
                }
                return null;
              },
              filter: function(tooltipItem) {
                return tooltipItem.dataset.label !== 'Target Weight' && tooltipItem.dataset.label !== 'Projected Path';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              drawBorder: false,
              color: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
            },
            ticks: {
              color: darkMode ? '#E5E7EB' : '#4B5563',
              callback: function(value) {
                return value + ' lbs';
              }
            }
          },
          x: {
            type: 'time',
            min: axisBounds.min,
            max: axisBounds.max,
            time: {
              parser: 'yyyy-MM-dd',
              tooltipFormat: 'MMM d, yyyy',
              displayFormats: {
                month: 'MMM yyyy'
              },
              unit: 'month'
            },
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false,
              color: darkMode ? '#E5E7EB' : '#6B7280',
              callback: function(value, index, ticks) {
                const date = new Date(value);
                const dateMonthKey = `${date.getFullYear()}-${date.getMonth()}`;
                
                // Check if this date corresponds to one of our monthly labels
                const matchingMonth = monthlyLabels.find(ml => ml.monthKey === dateMonthKey);
                
                if (matchingMonth) {
                  return matchingMonth.label;
                }
                
                // Special handling for the last month - make sure it appears even if the tick is not exactly on the 1st
                const isLastMonth = index === ticks.length - 1 || index === ticks.length - 2;
                if (isLastMonth) {
                  const lastMonthLabel = monthlyLabels[monthlyLabels.length - 1];
                  if (lastMonthLabel && dateMonthKey === lastMonthLabel.monthKey) {
                    return lastMonthLabel.label;
                  }
                }
                
                // Also check if this is close to the beginning of a month we want to show
                const dayOfMonth = date.getDate();
                if (dayOfMonth <= 3) {
                  const monthLabel = monthlyLabels.find(ml => 
                    ml.date.getFullYear() === date.getFullYear() && 
                    ml.date.getMonth() === date.getMonth()
                  );
                  
                  if (monthLabel) {
                    return monthLabel.label;
                  }
                }
                
                return '';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'nearest'
        }
      }
    });

    setChart(newChart);
    return () => {
      if (newChart) newChart.destroy();
    };
  }, [goal, weightLogs, darkMode]);

  if (!goal || weightLogs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Weight Progress</h2>
      <div className="relative h-80">
        <canvas 
          ref={canvas} 
          width={800} 
          height={320}
          className="w-full h-full"
        />
      </div>
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Your Weight</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Target Weight</span>
        </div>
        {weightLogs.length >= 2 && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Projected Path</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightProgressChart;