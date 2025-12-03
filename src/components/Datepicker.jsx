import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

function DatePicker({ value, onChange, placeholder = 'mm/dd/yyyy', disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Parse the value (YYYY-MM-DD format)
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // Format date as mm/dd/yyyy
  const formatDate = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Update input value when prop value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      setInputValue(formatDate(date));
      setDisplayMonth(date);
    } else {
      // Default to today's date
      const today = new Date();
      setInputValue(formatDate(today));
      setDisplayMonth(today);
    }
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Navigate months
  const goToPreviousMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  // Select date
  const selectDate = (day) => {
    const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const date = String(newDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${date}`);
    setIsOpen(false);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
  };

  // Parse and validate on blur
  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      // If empty, default to today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${date}`);
      return;
    }

    // Try to parse mm/dd/yyyy format
    const parts = inputValue.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (!isNaN(month) && !isNaN(day) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
          const yearStr = parsedDate.getFullYear();
          const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const dateStr = String(parsedDate.getDate()).padStart(2, '0');
          onChange(`${yearStr}-${monthStr}-${dateStr}`);
          return;
        }
      }
    }

    // If invalid, revert to previous or today
    if (value) {
      const date = new Date(value + 'T00:00:00');
      setInputValue(formatDate(date));
    } else {
      const today = new Date();
      setInputValue(formatDate(today));
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${date}`);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      inputRef.current?.blur();
      setIsOpen(false);
    }
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Current month days
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  };

  const monthName = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = getCalendarDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div ref={containerRef} className="relative">
      {/* Input field */}
      <div
        className={`
          flex items-center gap-2 px-4 py-3
          border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-700
          text-gray-900 dark:text-gray-100
          rounded-lg
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-violet-400 dark:hover:border-violet-500'}
          ${isOpen ? 'ring-2 ring-violet-500 border-violet-500' : ''}
          ${className}
        `}
      >
        <Calendar
          className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 cursor-pointer"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px] animate-slideUp">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {monthName}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, index) => (
              <button
                key={index}
                type="button"
                onClick={() => dayInfo.isCurrentMonth && selectDate(dayInfo.day)}
                disabled={!dayInfo.isCurrentMonth}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm
                  transition-all duration-200
                  ${dayInfo.isCurrentMonth
                    ? 'text-gray-900 dark:text-gray-100 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                    : 'text-gray-300 dark:text-gray-600 cursor-default'
                  }
                  ${dayInfo.isSelected
                    ? 'bg-violet-500 text-white hover:bg-violet-600 font-semibold'
                    : ''
                  }
                  ${dayInfo.isToday && !dayInfo.isSelected
                    ? 'ring-2 ring-violet-400 dark:ring-violet-500 font-semibold'
                    : ''
                  }
                `}
              >
                {dayInfo.day}
              </button>
            ))}
          </div>

          {/* Today button */}
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const date = String(today.getDate()).padStart(2, '0');
              onChange(`${year}-${month}-${date}`);
              setIsOpen(false);
            }}
            className="w-full mt-3 px-3 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
