import React, { useState } from 'react';
import { Plus, Minus, DollarSign, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { getTodayLocal, calculateStreak } from '../../utils/Utils';

const HabitCard = ({ habit, habitLogs = [], onLogHabit, onDeleteLog, onHabitClick }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [logQuantity, setLogQuantity] = useState(1);
  const [logCost, setLogCost] = useState('');


  const today = getTodayLocal();
  const todayLog = habitLogs.find(log => log.log_date === today);
  const isCompletedToday = !!todayLog;

  const streak = calculateStreak(habitLogs, habit);

  // Calculate weekly total for consumables
  const weeklyTotal = habitLogs
    .filter(log => {
      const logDate = new Date(log.log_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    })
    .reduce((sum, log) => {
      if (!habit.cost_per_unit) return sum;
      
      // Use log.cost if available, otherwise calculate from habit.cost_per_unit * quantity
      const cost = log.cost || (parseFloat(habit.cost_per_unit) * (log.quantity || 1));
      
      if (habit.category === 'healthy') {
        // For healthy habits, all costs are "spent"
        return sum + cost;
      } else if (habit.category === 'unhealthy') {
        // For unhealthy habits, distinguish between saved (success) and spent (slipped)
        if (log.notes === 'success') {
          return sum + cost; // Money saved by avoiding
        }
        // If slipped, we don't add to "saved" - this would be money lost/spent
      }
      
      return sum;
    }, 0);

  const handleQuickLog = () => {
    if (habit.category === 'unhealthy') {
      // For unhealthy habits, we're tracking "success" (money saved by not doing the habit)
      onLogHabit(habit.id, 1, habit.is_consumable ? habit.cost_per_unit : null, 'success');
    } else {
      // For healthy habits, normal logging
      onLogHabit(habit.id, 1, habit.is_consumable ? habit.cost_per_unit : null, 'completed');
    }
  };

  const handleRemoveLog = () => {
    onDeleteLog(habit.id);
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

  // Use habit color if available, otherwise fallback to category colors
  const getColorBasedStyles = () => {
    if (habit.color) {
      // Convert hex color to RGB for alpha backgrounds
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
      
      const rgb = hexToRgb(habit.color);
      if (rgb) {
        return {
          borderColor: habit.color,
          bgLight: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
          bgDark: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`
        };
      }
    }
    
    // Fallback to category colors
    return habit.category === 'healthy' 
      ? {
          borderColor: '#34d399', // emerald-400
          bgLight: 'rgba(52, 211, 153, 0.1)',
          bgDark: 'rgba(52, 211, 153, 0.2)'
        }
      : {
          borderColor: '#fb7185', // rose-400 
          bgLight: 'rgba(251, 113, 133, 0.1)',
          bgDark: 'rgba(251, 113, 133, 0.2)'
        };
  };
  
  const colorStyles = getColorBasedStyles();
  
  const categoryIconBg = 'bg-gray-50 dark:bg-gray-800';

  const categoryIcon = habit.category === 'healthy' ? TrendingUp : TrendingDown;
  const CategoryIcon = categoryIcon;

  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 border-t-4 overflow-hidden cursor-pointer"
      style={{ 
        borderTopColor: colorStyles.borderColor
      }}
      onClick={() => onHabitClick(habit)}
      title="Click to view habit details"
    >
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className={`w-12 h-12 rounded-lg ${categoryIconBg} flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-lg shadow-md`}>
                {habit.icon || (habit.category === 'healthy' ? '💚' : '⚠️')}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 truncate">
                {habit.name}
              </h3>
              <div className="flex items-center gap-2">
                <CategoryIcon className={`w-4 h-4 ${habit.category === 'healthy' ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium capitalize">{habit.category === 'healthy' ? 'Healthy Habit' : 'Vice to Avoid'}</span>
              </div>
            </div>
          </div>
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
              <div className={`text-2xl font-bold ${
                habit.category === 'unhealthy' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
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
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {isCompletedToday ? (
              <button
                onClick={handleRemoveLog}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all duration-200"
              >
                {habit.category === 'healthy' ? '✓ Completed Today' : '✓ Successfully Avoided'}
              </button>
            ) : (
              <div className="flex space-x-2">
                {habit.category === 'healthy' ? (
                  <>
                    <button
                      onClick={handleQuickLog}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Mark Complete
                    </button>
                    
                    <button
                      onClick={() => setIsLogging(true)}
                      className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleQuickLog}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Successfully Avoided
                    </button>
                    
                    <button
                      onClick={() => setIsLogging(true)}
                      className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl" onClick={(e) => e.stopPropagation()}>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitCard;