import React, { useState } from 'react';
import { Plus, Minus, DollarSign, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

const HabitCard = ({ habit, habitLogs = [], onLogHabit, onHabitClick }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [logQuantity, setLogQuantity] = useState(1);
  const [logCost, setLogCost] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayLog = habitLogs.find(log => log.log_date === today);
  const isCompletedToday = !!todayLog;

  // Calculate streak
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

  const streak = calculateStreak();

  // Calculate weekly total for consumables
  const weeklyTotal = habitLogs
    .filter(log => {
      const logDate = new Date(log.log_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    })
    .reduce((sum, log) => sum + (log.cost || 0), 0);

  const handleQuickLog = () => {
    if (habit.category === 'unhealthy') {
      // For unhealthy habits, we're tracking "success" (money saved by not doing the habit)
      onLogHabit(habit.id, 1, habit.is_consumable ? habit.cost_per_unit : null, 'success');
    } else {
      // For healthy habits, normal logging
      onLogHabit(habit.id, 1, habit.is_consumable ? habit.cost_per_unit : null);
    }
  };

  const handleDetailedLog = () => {
    const cost = habit.is_consumable ? parseFloat(logCost) || habit.cost_per_unit : null;
    const logType = habit.category === 'unhealthy' ? 'success' : 'completed';
    onLogHabit(habit.id, logQuantity, cost, logType);
    setIsLogging(false);
    setLogQuantity(1);
    setLogCost('');
  };

  const handleSlippedLog = () => {
    // For unhealthy habits only - when they "slipped" and did the vice
    const cost = habit.is_consumable ? parseFloat(logCost) || habit.cost_per_unit : null;
    onLogHabit(habit.id, logQuantity, cost, 'slipped');
    setIsLogging(false);
    setLogQuantity(1);
    setLogCost('');
  };

  const categoryGradient = habit.category === 'healthy' 
    ? 'from-emerald-500 to-teal-600' 
    : 'from-rose-500 to-pink-600';
  
  const categoryBg = habit.category === 'healthy'
    ? 'bg-emerald-50 dark:bg-emerald-950/50'
    : 'bg-rose-50 dark:bg-rose-950/50';

  const categoryIcon = habit.category === 'healthy' ? TrendingUp : TrendingDown;
  const CategoryIcon = categoryIcon;

  return (
    <div className={`group relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden`}>
      {/* Gradient top border */}
      <div className={`h-1 bg-gradient-to-r ${categoryGradient}`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onHabitClick(habit)}>
            <div className={`w-12 h-12 rounded-xl ${categoryBg} flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-200`}>
              {habit.icon || (habit.category === 'healthy' ? '💚' : '⚠️')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {habit.name}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <CategoryIcon className={`w-4 h-4 ${habit.category === 'healthy' ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className="capitalize font-medium">{habit.category === 'healthy' ? 'Healthy' : 'Vice'}</span>
              </div>
            </div>
          </div>
          
          {/* Status Badge with modern styling */}
          {isCompletedToday && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              habit.category === 'healthy' 
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
                : todayLog?.notes === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
                  : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800'
            }`}>
              {habit.category === 'healthy' 
                ? '✓ Completed' 
                : todayLog?.notes === 'success' 
                  ? '✓ Success' 
                  : '⚠ Relapsed'
              }
            </div>
          )}
        </div>

        {/* Description with modern typography */}
        {habit.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            {habit.description}
          </p>
        )}

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {streak}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Day Streak
            </div>
          </div>
          
          {habit.is_consumable ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${weeklyTotal.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {habit.category === 'unhealthy' ? 'Saved This Week' : 'Spent This Week'}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {habitLogs.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Total Logs
              </div>
            </div>
          )}
        </div>

        {/* Updated Action Buttons */}
        {!isLogging ? (
          <div className="flex space-x-2">
            {habit.category === 'healthy' ? (
              <>
                <button
                  onClick={handleQuickLog}
                  disabled={isCompletedToday}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isCompletedToday
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isCompletedToday ? 'Completed Today' : 'Mark Complete'}
                </button>
                
                <button
                  onClick={() => setIsLogging(true)}
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleQuickLog}
                disabled={isCompletedToday}
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isCompletedToday
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isCompletedToday ? 'Logged Today' : 'Avoided Today'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex space-x-2">
              <button
                onClick={() => setLogQuantity(Math.max(1, logQuantity - 1))}
                className="p-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={logQuantity}
                onChange={(e) => setLogQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                min="1"
              />
              <button
                onClick={() => setLogQuantity(logQuantity + 1)}
                className="p-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {habit.is_consumable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost ({habit.category === 'unhealthy' ? 'saved' : 'spent'})
                </label>
                <input
                  type="number"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                  placeholder={`${habit.cost_per_unit || '0.00'}`}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => setIsLogging(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              
              {habit.category === 'healthy' ? (
                <button
                  onClick={handleDetailedLog}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium"
                >
                  Log Habit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDetailedLog}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium"
                  >
                    Success
                  </button>
                  <button
                    onClick={handleSlippedLog}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium"
                  >
                    Slipped
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Today's Activity with modern styling */}
        {todayLog && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Today's activity:</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {todayLog.quantity} {habit.unit || 'times'}
                </span>
                {todayLog.cost && (
                  <span className={`font-semibold px-2 py-1 rounded-lg text-xs ${
                    habit.category === 'unhealthy' 
                      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/50'
                      : 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/50'
                  }`}>
                    ${todayLog.cost.toFixed(2)} {habit.category === 'unhealthy' ? 'saved' : 'spent'}
                  </span>
                )}
                {habit.category === 'unhealthy' && todayLog.notes && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    todayLog.notes === 'success' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'
                  }`}>
                    {todayLog.notes}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;