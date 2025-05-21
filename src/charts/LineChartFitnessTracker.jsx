import React, { useRef, useEffect, useState } from 'react';
import { useThemeProvider } from '../utils/ThemeContext';
import { chartColors } from './ChartjsConfig';

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

function LineChartFitnessTracker({
  data,
  width,
  height,
  options = {}
}) {
  const [chart, setChart] = useState(null);
  const canvas = useRef(null);
  const { currentTheme } = useThemeProvider();
  const darkMode = currentTheme === 'dark';
  const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = chartColors;

  // Default chart options
  const defaultOptions = {
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
            day: 'MMM d' // Format for x-axis labels
          },
          unit: 'day' // Show each logged day
        },
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: darkMode ? '#E5E7EB' : '#4B5563',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true, // Enable auto-skipping of labels
          maxTicksLimit: 10 // Maximum number of labels to show
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const date = new Date(context[0].raw.x);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += `${context.parsed.y} lbs`;
            return label;
          }
        },
        bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
        backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
        borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest'
    }
  };

  useEffect(() => {
    const ctx = canvas.current;
    if (!ctx) return;

    const newChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        ...defaultOptions,
        ...options
      }
    });

    setChart(newChart);
    return () => newChart.destroy();
  }, [data]);

  useEffect(() => {
    if (!chart) return;

    // Update colors for dark/light mode
    const scales = chart.options.scales;
    scales.y.grid.color = darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    scales.y.ticks.color = darkMode ? '#E5E7EB' : '#4B5563';
    scales.x.ticks.color = darkMode ? '#E5E7EB' : '#4B5563';

    // Update tooltip colors
    chart.options.plugins.tooltip = {
      ...chart.options.plugins.tooltip,
      bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
      backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
      borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light
    };

    chart.update();
  }, [currentTheme]);

  return (
    <canvas 
      ref={canvas} 
      width={width} 
      height={height}
      className="w-full h-full"
    />
  );
}

export default LineChartFitnessTracker;