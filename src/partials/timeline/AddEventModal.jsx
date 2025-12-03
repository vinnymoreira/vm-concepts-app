import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Music, Plane, Award, Heart, Briefcase, GraduationCap, Home, Star, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const categories = [
  { name: 'Music', icon: Music, color: 'from-purple-400 to-pink-500' },
  { name: 'Travel', icon: Plane, color: 'from-blue-400 to-cyan-500' },
  { name: 'Achievement', icon: Award, color: 'from-amber-400 to-orange-500' },
  { name: 'Personal', icon: Heart, color: 'from-rose-400 to-pink-500' },
  { name: 'Work', icon: Briefcase, color: 'from-indigo-400 to-blue-500' },
  { name: 'Education', icon: GraduationCap, color: 'from-green-400 to-emerald-500' },
  { name: 'Home', icon: Home, color: 'from-teal-400 to-cyan-500' },
  { name: 'Other', icon: Star, color: 'from-gray-400 to-gray-500' },
];

function AddEventModal({ isOpen, onClose, onEventSaved, event }) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [datePrecision, setDatePrecision] = useState('day');
  const [category, setCategory] = useState('Personal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  // Format date for display based on precision
  const formatDateForDisplay = (date, precision) => {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (precision === 'year') return `${year}`;
    if (precision === 'month') return `${month}/${year}`;
    return `${month}/${day}/${year}`;
  };

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setEventDate(event.event_date || '');
      const precision = event.date_precision || 'day';
      setDatePrecision(precision);
      setDateInput(formatDateForDisplay(event.event_date, precision));
      setCategory(event.category || 'Personal');
    } else {
      setTitle('');
      setEventDate('');
      setDateInput('');
      setDatePrecision('day');
      setCategory('Personal');
    }
    setError(null);
  }, [event, isOpen]);

  // Parse date input and determine precision
  const parseDateInput = (input) => {
    const trimmed = input.trim();

    // Year only: "2025" or "1995"
    if (/^\d{4}$/.test(trimmed)) {
      const year = parseInt(trimmed, 10);
      if (year >= 1900 && year <= 2100) {
        return {
          date: `${year}-01-01`,
          precision: 'year',
          valid: true
        };
      }
    }

    // Month/Year: "05/2025" or "5/2025"
    if (/^\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [month, year] = trimmed.split('/');
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        return {
          date: `${y}-${String(m).padStart(2, '0')}-01`,
          precision: 'month',
          valid: true
        };
      }
    }

    // Full date: "05/15/2025" or "5/15/2025"
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      const y = parseInt(year, 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        const parsedDate = new Date(y, m - 1, d);
        if (!isNaN(parsedDate.getTime())) {
          return {
            date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            precision: 'day',
            valid: true
          };
        }
      }
    }

    return { valid: false };
  };

  // Handle date input change
  const handleDateInputChange = (e) => {
    setDateInput(e.target.value);
  };

  // Handle date input blur (validate and parse)
  const handleDateInputBlur = () => {
    if (!dateInput.trim()) {
      setError('Please enter a date');
      return;
    }

    const result = parseDateInput(dateInput);
    if (result.valid) {
      setEventDate(result.date);
      setDatePrecision(result.precision);
      setError(null);
    } else {
      setError('Invalid date format. Use: 2025 (year), 05/2025 (month/year), or 05/15/2025 (full date)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Please enter an event title');
      return;
    }

    // Validate and parse date on submit
    if (!dateInput.trim()) {
      setError('Please enter a date');
      return;
    }

    const dateResult = parseDateInput(dateInput);
    if (!dateResult.valid) {
      setError('Invalid date format. Use: 2025 (year), 05/2025 (month/year), or 05/15/2025 (full date)');
      return;
    }

    setSaving(true);

    try {
      const eventData = {
        user_id: user.id,
        title: title.trim(),
        event_date: dateResult.date,
        date_precision: dateResult.precision,
        category: category,
      };

      if (event?.id) {
        // Update existing event
        const { error } = await supabase
          .from('timeline_events')
          .update(eventData)
          .eq('id', event.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new event
        const { error } = await supabase
          .from('timeline_events')
          .insert([eventData]);

        if (error) throw error;
      }

      // Success - close modal and reset state
      setSaving(false);
      onEventSaved();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8 animate-slideUp">
          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={saving}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
              {event ? 'Edit Event' : 'New Life Event'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Capture a moment that matters in your journey
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., First concert, Trip to Paris, Graduated..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                disabled={saving}
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Date
              </label>
              <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={dateInput}
                  onChange={handleDateInputChange}
                  onBlur={handleDateInputBlur}
                  placeholder="2025 or 05/2025 or 05/15/2025"
                  disabled={saving}
                  className="flex-1 bg-transparent outline-none border-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter year only (2025), month/year (05/2025), or full date (05/15/2025)
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      disabled={saving}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-amber-400 dark:border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Icon with gradient */}
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center ${
                          isSelected ? 'shadow-lg' : 'opacity-70'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      {/* Category name */}
                      <span
                        className={`text-xs font-medium ${
                          isSelected
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {cat.name}
                      </span>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddEventModal;
