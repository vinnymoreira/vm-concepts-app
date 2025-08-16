import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const DashboardCardHabits = () => {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHabitsData();
    }
  }, [user]);

  const fetchHabitsData = async () => {
    try {
      setLoading(true);
      
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
      
      if (habitsError) throw habitsError;

      // Fetch today's logs
      const today = new Date().toISOString().split('T')[0];
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*, habits(name, category, icon, color)')
        .eq('user_id', user.id)
        .eq('log_date', today);
      
      if (logsError) throw logsError;

      setHabits(habitsData || []);
      setHabitLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching habits data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-4 text-red-500">
          Error loading habits: {error}
        </div>
      </div>
    );
  }

  const healthyHabits = habits.filter(h => h.category === 'healthy').length;
  const unhealthyHabits = habits.filter(h => h.category === 'unhealthy').length;
  const completedToday = habitLogs.length;
  
  const totalSpentToday = habitLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'healthy') {
      return sum + (log.cost || 0);
    }
    return sum;
  }, 0);
  
  const totalSavedToday = habitLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'unhealthy' && log.notes === 'success') {
      return sum + (log.cost || 0);
    }
    return sum;
  }, 0);
  
  const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Habits Progress</h2>
        <Link 
          to="/habits" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All
        </Link>
      </header>
      
      <div className="p-5">
        {habits.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Target className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No habits yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start building better habits and monitoring vices
            </p>
            <Link 
              to="/habits" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <>
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-500">{completionRate}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Today's Progress</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{healthyHabits}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Healthy Habits</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{unhealthyHabits}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Vices Tracked</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">${totalSavedToday.toFixed(2)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Saved Today</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {completedToday} of {habits.length} habits
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Today's Completed Habits */}
            {habitLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Completed Today
                </h3>
                <div className="space-y-2">
                  {habitLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{log.habits?.icon || (log.habits?.category === 'healthy' ? '❤️' : '⚠️')}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {log.habits?.name}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            {log.habits?.category === 'healthy' ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                            <span>{log.quantity} times</span>
                            {log.habits?.category === 'unhealthy' && log.notes && (
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                log.notes === 'success' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {log.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {log.cost && (
                        <div className={`text-sm font-medium ${
                          log.habits?.category === 'unhealthy' && log.notes === 'success'
                            ? 'text-green-500'
                            : 'text-orange-500'
                        }`}>
                          ${log.cost.toFixed(2)} {log.habits?.category === 'unhealthy' && log.notes === 'success' ? 'saved' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {habitLogs.length > 3 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                      +{habitLogs.length - 3} more completed
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Habits */}
            {habits.length > completedToday && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Still to Complete
                </h3>
                <div className="space-y-2">
                  {habits
                    .filter(habit => !habitLogs.some(log => log.habit_id === habit.id))
                    .slice(0, 2)
                    .map((habit) => (
                      <div key={habit.id} className="flex items-center space-x-3 py-2">
                        {habit.icon && <span className="text-lg">{habit.icon}</span>}
                        <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {habit.name}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            {habit.category === 'healthy' ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className="capitalize">{habit.category === 'healthy' ? 'Healthy' : 'Vice'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardCardHabits;