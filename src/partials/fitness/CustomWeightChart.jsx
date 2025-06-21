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

const CustomWeightChart = ({ goal, weightLogs }) => {
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

    // Create a timezone-safe date formatter
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
        {
          label: 'Target Weight',
          data: sortedLogs.map(log => ({
            x: log.log_date,
            y: goal.target_weight
          })),
          borderColor: '#10B981',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          backgroundColor: 'rgba(16, 185, 129, 0.05)'
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

  useEffect(() => {
    const ctx = canvas.current;
    if (!ctx) return;

    const data = prepareChartData();
    if (!data) return;

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
                
                // Skip Target Weight and Projected Path datasets
                if (label === 'Target Weight' || label === 'Projected Path') {
                  return null;
                }
                
                return `${label}: ${context.parsed.y} lbs`;
              },
              afterLabel: function(context) {
                // Only show target weight for the main Weight dataset
                if (context.dataset.label === 'Weight') {
                  return `Target: ${goal.target_weight} lbs`;
                }
                return null;
              },
              filter: function(tooltipItem) {
                // Filter out Target Weight and Projected Path datasets
                return tooltipItem.dataset.label !== 'Target Weight' && tooltipItem.dataset.label !== 'Projected Path';
              }
            },
            bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
            backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
            borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
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
            time: {
              parser: 'yyyy-MM-dd',
              tooltipFormat: 'MMM d, yyyy',
              displayFormats: {
                day: 'MMM d'
              },
              unit: 'day'
            },
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 8,
              color: darkMode ? '#E5E7EB' : '#6B7280',
              callback: function(value, index, ticks) {
                // Show only dates where we have actual weight logs
                const date = new Date(value);
                const dateStr = date.toISOString().split('T')[0];
                
                // Check if this date matches any logged date
                const hasLog = weightLogs.some(log => log.log_date === dateStr);
                
                if (hasLog) {
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
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
    return () => newChart.destroy();
  }, [goal, weightLogs]);

  useEffect(() => {
    if (!chart) return;

    // Update colors for dark/light mode
    const scales = chart.options.scales;
    scales.y.grid.color = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    scales.y.ticks.color = darkMode ? '#E5E7EB' : '#4B5563';
    scales.x.ticks.color = darkMode ? '#E5E7EB' : '#6B7280';

    chart.options.plugins.tooltip.bodyColor = darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light;
    chart.options.plugins.tooltip.backgroundColor = darkMode ? tooltipBgColor.dark : tooltipBgColor.light;
    chart.options.plugins.tooltip.borderColor = darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light;

    chart.update();
  }, [currentTheme]);

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

export default CustomWeightChart;