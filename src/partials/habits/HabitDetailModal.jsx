import React, { useState } from 'react';
import { X, Calendar, TrendingUp, TrendingDown, DollarSign, Target, Edit3, Save, RotateCcw, Trash2 } from 'lucide-react';

const HabitDetailModal = ({ habit, habitLogs = [], onClose, onLogHabit, onDeleteLog, onUpdateHabit, onDeleteHabit }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    target_frequency: habit?.target_frequency || 1,
    frequency_period: habit?.frequency_period || 'daily',
    unit: habit?.unit || 'times',
    cost_per_unit: habit?.cost_per_unit || '',
    icon: habit?.icon || '📋',
    color: habit?.color || '#6366f1'
  });

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

  if (!habit) return null;

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save edit
  const handleSaveEdit = () => {
    const updates = {
      ...editForm,
      cost_per_unit: editForm.cost_per_unit ? parseFloat(editForm.cost_per_unit) : null
    };
    onUpdateHabit(habit.id, updates);
    setIsEditing(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditForm({
      name: habit.name,
      description: habit.description || '',
      target_frequency: habit.target_frequency || 1,
      frequency_period: habit.frequency_period || 'daily',
      unit: habit.unit || 'times',
      cost_per_unit: habit.cost_per_unit || '',
      icon: habit.icon || '📋',
      color: habit.color || '#6366f1'
    });
    setIsEditing(false);
  };

  // Handle delete habit
  const handleDeleteHabit = () => {
    const confirmMessage = `Are you sure you want to delete "${habit.name}"? This will permanently remove the habit and all its logs. This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      onDeleteHabit(habit.id);
      onClose();
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const periodLogs = habitLogs.filter(log => 
      new Date(log.log_date) >= startDate
    );

    const totalQuantity = periodLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalCost = periodLogs.reduce((sum, log) => {
      if (!habit.cost_per_unit) return sum;
      
      // Use log.cost if available, otherwise calculate from habit.cost_per_unit * quantity
      const cost = log.cost || (parseFloat(habit.cost_per_unit) * (log.quantity || 1));
      
      if (habit.category === 'healthy') {
        // For healthy habits, all costs are "spent"
        return sum + cost;
      } else if (habit.category === 'unhealthy') {
        // For unhealthy habits, show money saved when successfully avoided
        if (log.notes === 'success') {
          return sum + cost; // Money saved by avoiding
        }
        // Note: If slipped, this could be tracked separately as "money lost"
      }
      
      return sum;
    }, 0);
    const avgQuantity = periodLogs.length > 0 ? totalQuantity / periodLogs.length : 0;
    const totalDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const completedDays = periodLogs.length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    return {
      totalQuantity,
      totalCost,
      avgQuantity,
      completedDays,
      totalDays,
      completionRate,
      periodLogs
    };
  };

  const stats = calculateStats();

  // Calculate current streak based on habit frequency
  const calculateStreak = () => {
    if (!habitLogs || habitLogs.length === 0) return 0;
    
    const sortedLogs = habitLogs
      .sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
    
    const today = new Date();
    
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
    let currentPeriodStart = new Date(today);
    
    // For daily habits, use consecutive day logic
    if (frequencyDays === 1) {
      let expectedDate = new Date(today);
      
      for (const log of sortedLogs) {
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (log.log_date === expectedDateStr) {
          streak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      // For weekly/monthly habits, check if there's a log in each period
      for (let period = 0; period < 52; period++) { // Max 52 periods to check
        const periodEnd = new Date(currentPeriodStart);
        const periodStart = new Date(currentPeriodStart);
        periodStart.setDate(periodStart.getDate() - frequencyDays + 1);
        
        const periodStartStr = periodStart.toISOString().split('T')[0];
        const periodEndStr = periodEnd.toISOString().split('T')[0];
        
        // Check if there's a log in this period
        const hasLogInPeriod = sortedLogs.some(log => 
          log.log_date >= periodStartStr && log.log_date <= periodEndStr
        );
        
        if (hasLogInPeriod) {
          streak++;
          currentPeriodStart.setDate(currentPeriodStart.getDate() - frequencyDays);
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  // Generate calendar view for the current month
  const generateCalendarData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const log = habitLogs.find(log => log.log_date === dateStr);
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateStr === now.toISOString().split('T')[0];
        
        weekDays.push({
          date: new Date(currentDate),
          dateStr,
          log,
          isCurrentMonth,
          isToday
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  const calendarData = generateCalendarData();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const CategoryIcon = habit.category === 'healthy' ? TrendingUp : TrendingDown;
  const categoryColor = habit.category === 'healthy' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4 flex-1">
              {isEditing ? (
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{editForm.icon}</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="text-2xl font-bold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-indigo-300 focus:border-indigo-500 outline-none w-full"
                        placeholder="Habit name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Target
                      </label>
                      <input
                        type="number"
                        name="target_frequency"
                        value={editForm.target_frequency}
                        onChange={handleEditChange}
                        min="1"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        name="unit"
                        value={editForm.unit}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="times, minutes, pages"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Per
                      </label>
                      <select
                        name="frequency_period"
                        value={editForm.frequency_period}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="daily">Day</option>
                        <option value="weekly">Week</option>
                        <option value="monthly">Month</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows="2"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Optional description"
                    />
                  </div>
                  
                  {habit.is_consumable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Cost per {editForm.unit} ($)
                      </label>
                      <input
                        type="number"
                        name="cost_per_unit"
                        value={editForm.cost_per_unit}
                        onChange={handleEditChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  
                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Choose Icon
                    </label>
                    <div className="grid grid-cols-11 gap-2">
                      {commonIcons[habit.category].map((icon, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, icon }))}
                          className={`w-8 h-8 text-lg rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                            editForm.icon === icon 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 scale-105' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Choose Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {predefinedColors.map((color, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, color }))}
                          className={`w-6 h-6 rounded-md border-2 transition-all duration-200 hover:scale-110 ${
                            editForm.color === color 
                              ? 'border-gray-800 dark:border-gray-200 scale-110 dark:ring-gray-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-4xl">{habit.icon || '📋'}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {habit.name}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <CategoryIcon className={`w-4 h-4 ${categoryColor}`} />
                      <span className="capitalize">{habit.category} Habit</span>
                      {habit.is_consumable && (
                        <>
                          <span>•</span>
                          <DollarSign className="w-4 h-4" />
                          <span>Consumable</span>
                        </>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {habit.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveEdit}
                    className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    title="Save changes"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Cancel editing"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  title="Edit habit"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={onClose} 
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Period Selector */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              {[
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
                { key: 'year', label: 'Year' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-4 py-2 text-sm font-medium ${
                    selectedPeriod === period.key
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${period.key === 'week' ? 'rounded-l-lg' : period.key === 'year' ? 'rounded-r-lg' : ''} border-r border-gray-300 dark:border-gray-600 last:border-r-0`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-500">{currentStreak}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-500">{stats.completedDays}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Days Completed</div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.completionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</div>
            </div>
            
            {habit.is_consumable ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${
                  habit.category === 'healthy' 
                    ? 'text-orange-500' 
                    : 'text-green-500'
                }`}>
                  {formatCurrency(stats.totalCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {habit.category === 'healthy' ? 'Total Spent' : 'Total Saved'}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-500">{stats.totalQuantity}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total {habit.unit || 'Times'}</div>
              </div>
            )}
          </div>

          {/* Calendar View */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              This Month
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    let dayClass = "aspect-square flex items-center justify-center text-sm rounded-lg ";
                    
                    if (!day.isCurrentMonth) {
                      dayClass += "text-gray-300 dark:text-gray-600";
                    } else if (day.isToday) {
                      dayClass += "bg-indigo-500 text-white font-bold";
                    } else if (day.log) {
                      if (habit.category === 'healthy') {
                        dayClass += "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-medium";
                      } else {
                        dayClass += "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 font-medium";
                      }
                    } else {
                      dayClass += "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
                    }

                    return (
                      <div key={dayIndex} className={dayClass} title={day.log ? `${day.log.quantity} ${habit.unit || 'times'}${day.log.cost ? ` • ${formatCurrency(day.log.cost)}` : ''}` : ''}>
                        {day.date.getDate()}
                        {day.log && (
                          <div className="absolute mt-6 text-xs">
                            •
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Calendar Legend */}
            <div className="flex justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${habit.category === 'healthy' ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Not completed</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Recent Activity
            </h3>
            
            {stats.periodLogs.length > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {stats.periodLogs
                    .sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
                    .slice(0, 10)
                    .map((log, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {new Date(log.log_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {log.quantity} {habit.unit || 'times'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {log.cost && (
                            <span className="text-sm font-medium text-orange-500">
                              {formatCurrency(log.cost)}
                            </span>
                          )}
                          {log.notes && habit.category === 'healthy' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate" title={log.notes}>
                              "{log.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity logged for this period</p>
              </div>
            )}
          </div>

          {/* Goal Progress */}
          {habit.target_frequency && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Goal Progress
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Target: {habit.target_frequency} {habit.unit || 'times'} per {habit.frequency_period || 'day'}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {stats.avgQuantity.toFixed(1)} avg per day
                  </span>
                </div>
                
                {selectedPeriod === 'week' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        stats.completionRate >= 80 ? 'bg-green-500' : 
                        stats.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, stats.completionRate)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleDeleteHabit}
              className="px-6 py-3 text-sm font-medium text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Habit</span>
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayLog = habitLogs.find(log => log.log_date === today);
                  if (todayLog) {
                    // If already logged, remove the log (toggle off)
                    onDeleteLog(habit.id, today);
                  } else {
                    // If not logged, add the log (toggle on)
                    onLogHabit(habit.id, 1, habit.is_consumable ? habit.cost_per_unit : null, 'completed');
                  }
                }}
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                  habitLogs.some(log => log.log_date === new Date().toISOString().split('T')[0])
                    ? 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {habitLogs.some(log => log.log_date === new Date().toISOString().split('T')[0]) 
                  ? 'Already Logged Today' 
                  : 'Log for Today'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitDetailModal;