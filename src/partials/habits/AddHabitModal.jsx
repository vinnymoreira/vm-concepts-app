import React, { useState } from 'react';
import { X, DollarSign, Smile, AlertTriangle, Ban, Plus } from 'lucide-react';

const AddHabitModal = ({ isOpen, onClose, onAddHabit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'healthy',
    is_consumable: false,
    unit: 'times',
    target_frequency: 1,
    frequency_period: 'daily',
    cost_per_unit: '',
    icon: '📋',
    color: '#6366f1'
  });
  
  const [errors, setErrors] = useState({});
  const [showDescription, setShowDescription] = useState(false);

  const commonIcons = {
    healthy: ['💪', '🏃‍♂️', '📖', '🧘‍♀️', '💧', '🥗', '😴', '🚶‍♀️', '🏋️‍♂️', '🧠', '🎯'],
    unhealthy: ['🚬', '🍺', '🍔', '📱', '🎮', '☕', '🍰', '🛋️', '📺', '🛒', '💸']
  };

  const predefinedColors = [
    // Solid colors (Trello-inspired)
    '#ef4444', // Red
    '#f97316', // Orange  
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    
    // Pastel colors
    '#fca5a5', // Light red
    '#fed7aa', // Light orange
    '#fde68a', // Light yellow
    '#bbf7d0', // Light green
    '#a7f3d0', // Light emerald
    '#bfdbfe', // Light blue
    '#ddd6fe', // Light purple
    '#fbcfe8'  // Light pink
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Habit name is required';
    }
    
    if (formData.target_frequency < 1) {
      newErrors.target_frequency = 'Target frequency must be at least 1';
    }
    
    if (formData.is_consumable && formData.cost_per_unit && parseFloat(formData.cost_per_unit) < 0) {
      newErrors.cost_per_unit = 'Cost cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const habitData = {
      ...formData,
      cost_per_unit: formData.is_consumable && formData.cost_per_unit 
        ? parseFloat(formData.cost_per_unit) 
        : null
    };
    
    onAddHabit(habitData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: 'healthy',
      is_consumable: false,
      unit: 'times',
      target_frequency: 1,
      frequency_period: 'daily',
      cost_per_unit: '',
      icon: '📋',
      color: '#6366f1'
    });
    setErrors({});
    setShowDescription(false);
  };

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center z-50" 
      onClick={handleOutsideClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Habit</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-colors ${
                  errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                }`}
                placeholder="e.g., Morning workout, Read before bed"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            {/* Toggle Description with Smooth Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${showDescription ? 'rotate-45' : ''}`} />
                <span>{showDescription ? 'Hide description' : 'Add description'}</span>
              </button>
              
              {/* Smooth Accordion Container */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showDescription ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="mt-2">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-colors"
                    placeholder="Optional description of your habit..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Habit Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Habit Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: 'healthy' }))}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                  formData.category === 'healthy'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <Smile className={`w-6 h-6 ${formData.category === 'healthy' ? 'text-indigo-500' : 'text-gray-400'}`} />
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Healthy Habit</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Build positive routines</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: 'unhealthy' }))}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                  formData.category === 'unhealthy'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <AlertTriangle className={`w-6 h-6 ${formData.category === 'unhealthy' ? 'text-indigo-500' : 'text-gray-400'}`} />
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Vice to Quit</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Break negative patterns</div>
                </div>
              </button>
            </div>
          </div>

          {/* Frequency Settings */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Target Frequency
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target
                </label>
                <input
                  type="number"
                  name="target_frequency"
                  value={formData.target_frequency}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-colors ${
                    errors.target_frequency ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                {errors.target_frequency && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.target_frequency}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-colors"
                  placeholder="e.g., times, minutes, pages"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Per
                </label>
                <select
                  name="frequency_period"
                  value={formData.frequency_period}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-colors"
                >
                  <option value="daily">Day</option>
                  <option value="weekly">Week</option>
                  <option value="monthly">Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Choose Icon
            </label>
            <div className="grid grid-cols-12 gap-3">
              {commonIcons[formData.category].map((icon, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`w-12 h-12 text-2xl rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    formData.icon === icon 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 scale-105' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Choose Color
            </label>
            <div className="flex gap-2">
              {predefinedColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 rounded-md border-2 transition-all duration-200 hover:scale-110 ${
                    formData.color === color 
                      ? 'border-gray-800 dark:border-gray-200 scale-110 dark:ring-gray-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Consumable Options - Only show when Vice to Quit is selected */}
          {formData.category === 'unhealthy' && (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="is_consumable"
                  checked={formData.is_consumable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  This habit involves spending money
                </label>
              </div>
              
              {formData.is_consumable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cost per {formData.unit} ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="cost_per_unit"
                      value={formData.cost_per_unit}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 transition-colors ${
                        errors.cost_per_unit ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.cost_per_unit && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cost_per_unit}</p>}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Add Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHabitModal;