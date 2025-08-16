import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getTodayLocal, getLocalDateString } from '../utils/Utils';

const HabitDatePicker = ({ selectedDate, onDateSelect, className = '' }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selectedDate || getTodayLocal()));

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = getTodayLocal();
    const yesterday = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = getLocalDateString(currentDate);
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateStr === getTodayLocal();
        const isSelected = dateStr === selectedDate;
        const isFuture = currentDate > new Date();
        
        weekDays.push({
          date: new Date(currentDate),
          dateStr,
          isCurrentMonth,
          isToday,
          isSelected,
          isFuture
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      days.push(weekDays);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setViewDate(newDate);
  };

  const selectDate = (dateStr) => {
    onDateSelect(dateStr);
    setShowCalendar(false);
  };

  const quickDates = [
    { label: 'Today', value: getTodayLocal() },
    { label: 'Yesterday', value: getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000)) },
    { label: '2 days ago', value: getLocalDateString(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) },
    { label: '3 days ago', value: getLocalDateString(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) }
  ];

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        <span className="text-gray-700 dark:text-gray-300">
          {formatDisplayDate(selectedDate)}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {showCalendar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowCalendar(false)}
          />
          
          {/* Calendar Dropdown */}
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 p-4 w-80">
            {/* Quick Date Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickDates.map((quickDate) => (
                  <button
                    key={quickDate.value}
                    type="button"
                    onClick={() => selectDate(quickDate.value)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedDate === quickDate.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {quickDate.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              {calendarDays.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    let dayClass = "w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors cursor-pointer ";
                    
                    if (!day.isCurrentMonth) {
                      dayClass += "text-gray-300 dark:text-gray-600";
                    } else if (day.isFuture) {
                      dayClass += "text-gray-400 dark:text-gray-500 cursor-not-allowed";
                    } else if (day.isSelected) {
                      dayClass += "bg-indigo-500 text-white font-medium";
                    } else if (day.isToday) {
                      dayClass += "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium";
                    } else {
                      dayClass += "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
                    }

                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        onClick={() => !day.isFuture && selectDate(day.dateStr)}
                        disabled={day.isFuture}
                        className={dayClass}
                        title={day.isFuture ? "Cannot log future dates" : ""}
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HabitDatePicker;