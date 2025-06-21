import React, { useState } from 'react';
import { X, Calendar, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

const HabitDetailModal = ({ habit, habitLogs = [], onClose, onLogHabit }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'

  if (!habit) return null;

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
    const totalCost = periodLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
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

  // Calculate current streak
  const calculateStreak = () => {
    if (!habitLogs || habitLogs.length === 0) return 0;
    
    const sortedLogs = habitLogs
      .sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const log of sortedLogs) {
      const logDate = new Date(log.log_date);
      const daysDiff = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
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
            <div className="flex items-center space-x-4">
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
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
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
                <div className="text-2xl font-bold text-orange-500">
                  {formatCurrency(stats.totalCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Spent</div>
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
                          {log.notes && (
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
          <div className="flex justify-end space-x-4">
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
                if (!todayLog) {
                  onLogHabit(habit.id, 1, habit.is_consumable ? habit.cost_per_unit : null);
                }
              }}
              disabled={habitLogs.some(log => log.log_date === new Date().toISOString().split('T')[0])}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
  );
};

export default HabitDetailModal;