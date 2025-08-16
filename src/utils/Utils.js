import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfigFile from '@tailwindConfig'

export const tailwindConfig = () => {
  return resolveConfig(tailwindConfigFile)
}

export const hexToRGB = (h) => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (h.length === 4) {
    r = `0x${h[1]}${h[1]}`;
    g = `0x${h[2]}${h[2]}`;
    b = `0x${h[3]}${h[3]}`;
  } else if (h.length === 7) {
    r = `0x${h[1]}${h[2]}`;
    g = `0x${h[3]}${h[4]}`;
    b = `0x${h[5]}${h[6]}`;
  }
  return `${+r},${+g},${+b}`;
};

export const formatValue = (value) => Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value);

export const formatThousands = (value) => Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value);

// Date utilities that handle timezone-aware date operations
export const getLocalDateString = (date = new Date()) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayLocal = () => {
  return getLocalDateString(new Date());
};

export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const isToday = (dateString) => {
  return dateString === getTodayLocal();
};

export const calculateStreak = (habitLogs, habit) => {
  if (!habitLogs || habitLogs.length === 0) return 0;
  
  const sortedLogs = habitLogs
    .sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
  
  // Get the frequency period in days
  const getFrequencyDays = () => {
    switch (habit.frequency_period) {
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'daily':
      default: return 1;
    }
  };
  
  const frequencyDays = getFrequencyDays();
  let streak = 0;
  
  // For daily habits, check consecutive days
  if (frequencyDays === 1) {
    let expectedDate = getTodayLocal();
    
    for (const log of sortedLogs) {
      if (log.log_date === expectedDate) {
        streak++;
        // Move to previous day
        const prevDate = new Date(expectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        expectedDate = getLocalDateString(prevDate);
      } else {
        break;
      }
    }
  } else {
    // For weekly/monthly habits, check if there's a log in each period
    let currentPeriodEnd = new Date();
    
    for (let period = 0; period < 52; period++) { // Max 52 periods to check
      const periodStart = new Date(currentPeriodEnd);
      periodStart.setDate(periodStart.getDate() - frequencyDays + 1);
      
      const periodStartStr = getLocalDateString(periodStart);
      const periodEndStr = getLocalDateString(currentPeriodEnd);
      
      // Check if there's a log in this period
      const hasLogInPeriod = sortedLogs.some(log => 
        log.log_date >= periodStartStr && log.log_date <= periodEndStr
      );
      
      if (hasLogInPeriod) {
        streak++;
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() - frequencyDays);
      } else {
        break;
      }
    }
  }
  
  return streak;
};
