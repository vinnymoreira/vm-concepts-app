import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import HabitsOverview from '../partials/habits/HabitsOverview';
import HabitsGrid from '../partials/habits/HabitsGrid';
import AddHabitModal from '../partials/habits/AddHabitModal';
import HabitDetailModal from '../partials/habits/HabitDetailModal';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Habits() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'healthy', 'unhealthy'
  const { user } = useAuth();

  useEffect(() => {
    fetchHabits();
    fetchHabitLogs();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHabits(data || []);
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitLogs = async () => {
    try {
      // Get logs for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      setHabitLogs(data || []);
    } catch (err) {
      console.error('Error fetching habit logs:', err);
      setError(err.message);
    }
  };

  const handleAddHabit = async (habitData) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{
          ...habitData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setHabits([data, ...habits]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding habit:', err);
      setError(err.message);
    }
  };

  const handleLogHabit = async (habitId, quantity = 1, cost = null, notes = '') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert([{
          habit_id: habitId,
          user_id: user.id,
          log_date: today,
          quantity,
          cost,
          notes
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update habit logs state
      const updatedLogs = habitLogs.filter(log => 
        !(log.habit_id === habitId && log.log_date === today)
      );
      setHabitLogs([data, ...updatedLogs]);
    } catch (err) {
      console.error('Error logging habit:', err);
      setError(err.message);
    }
  };

  const filteredHabits = habits.filter(habit => {
    if (viewMode === 'all') return true;
    return habit.category === viewMode;
  });

  const healthyHabits = habits.filter(h => h.category === 'healthy');
  const unhealthyHabits = habits.filter(h => h.category === 'unhealthy');

  // Calculate statistics
  const todayLogs = habitLogs.filter(log => 
    log.log_date === new Date().toISOString().split('T')[0]
  );
  
  const totalSpentToday = todayLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'unhealthy') {
      // For unhealthy habits, if it's a "success", they saved money
      return log.notes === 'success' ? sum + (log.cost || 0) : sum;
    } else {
      // For healthy habits, normal spending
      return sum + (log.cost || 0);
    }
  }, 0);

  const totalSavedToday = todayLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'unhealthy' && log.notes === 'success') {
      return sum + (log.cost || 0);
    }
    return sum;
  }, 0);

  const completedToday = todayLogs.length;
  const totalHabits = habits.length;

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="flex items-center justify-center p-4">
                Loading habits...
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-red-500 p-4">Error: {error}</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Title and Actions */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Habits
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your daily habits and build better routines
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Updated Filter Buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                      viewMode === 'all' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    All Habits
                  </button>
                  <button
                    onClick={() => setViewMode('healthy')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center space-x-1 ${
                      viewMode === 'healthy' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Healthy</span>
                  </button>
                  <button
                    onClick={() => setViewMode('unhealthy')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center space-x-1 ${
                      viewMode === 'unhealthy' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Vices</span>
                  </button>
                </div>
                
                {/* Updated Add Button */}
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Habit</span>
                </button>
              </div>
            </div>

            {/* Overview Stats */}
            <HabitsOverview 
              totalHabits={totalHabits}
              completedToday={completedToday}
              totalSpentToday={totalSpentToday}
              totalSavedToday={totalSavedToday}
              healthyHabits={healthyHabits.length}
              unhealthyHabits={unhealthyHabits.length}
            />

            {/* Habits Grid */}
            <HabitsGrid 
              habits={filteredHabits}
              habitLogs={habitLogs}
              onLogHabit={handleLogHabit}
              onHabitClick={setSelectedHabit}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />
      
      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          habitLogs={habitLogs.filter(log => log.habit_id === selectedHabit.id)}
          onClose={() => setSelectedHabit(null)}
          onLogHabit={handleLogHabit}
        />
      )}
    </div>
  );
}

export default Habits;