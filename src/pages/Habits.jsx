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
  
  // ✅ Get user and loading from useAuth  
  const { user, loading: authLoading } = useAuth();

  // ✅ Fixed useEffect with proper dependencies and cleanup
  useEffect(() => {
    let isMounted = true;

    const initializeHabits = async () => {
      if (authLoading) return; // Wait for auth to initialize
      
      if (!user) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Fetch habits and logs
        await Promise.all([
          fetchHabits(isMounted),
          fetchHabitLogs(isMounted)
        ]);

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing habits:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeHabits();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const fetchHabits = async (isMounted = true) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)  // ✅ Filter by user
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (isMounted) {
        setHabits(data || []);
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
      if (isMounted) {
        setError(err.message);
      }
    }
  };

  const fetchHabitLogs = async (isMounted = true) => {
    if (!user) return;

    try {
      // Get logs for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)  // ✅ Filter by user
        .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      
      if (isMounted) {
        setHabitLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching habit logs:', err);
      if (isMounted) {
        setError(err.message);
      }
    }
  };

  const handleAddHabit = async (habitData) => {
    if (!user) {
      setError('You must be logged in to add habits');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{ ...habitData, user_id: user.id }])  // ✅ Add user_id
        .select();

      if (error) throw error;

      setHabits(prev => [data[0], ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding habit:', err);
      setError(err.message);
    }
  };

  const handleUpdateHabit = async (habitId, updates) => {
    if (!user) {
      setError('You must be logged in to update habits');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .eq('user_id', user.id)  // ✅ Ensure user owns the habit
        .select();

      if (error) throw error;

      setHabits(prev => prev.map(habit => 
        habit.id === habitId ? { ...habit, ...updates } : habit
      ));
    } catch (err) {
      console.error('Error updating habit:', err);
      setError(err.message);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!user) {
      setError('You must be logged in to delete habits');
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);  // ✅ Ensure user owns the habit

      if (error) throw error;

      setHabits(prev => prev.filter(habit => habit.id !== habitId));
      setSelectedHabit(null);
    } catch (err) {
      console.error('Error deleting habit:', err);
      setError(err.message);
    }
  };

  const handleLogHabit = async (habitId, logData) => {
    if (!user) {
      setError('You must be logged in to log habits');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('habit_logs')
        .insert([{
          habit_id: habitId,
          user_id: user.id,  // ✅ Add user_id
          log_date: today,
          ...logData
        }])
        .select();

      if (error) throw error;

      setHabitLogs(prev => [data[0], ...prev]);
      
      // Refresh habits to update streak counts
      fetchHabits();
    } catch (err) {
      console.error('Error logging habit:', err);
      setError(err.message);
    }
  };

  // ✅ Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Show auth required message
  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Authentication Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to view your habits.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Show data loading spinner
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <span className="ml-2">Loading habits...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Show error state
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchHabits();
                    fetchHabitLogs();
                  }}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const filteredHabits = habits.filter(habit => {
    if (viewMode === 'all') return true;
    return habit.category === viewMode;
  });

  // ✅ Calculate stats for the overview component
  const healthyHabits = habits.filter(habit => habit.category === 'healthy');
  const unhealthyHabits = habits.filter(habit => habit.category === 'unhealthy');
  
  // Get today's logs
  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = habitLogs.filter(log => log.log_date === today);
  
  // Calculate financial stats
  const totalSpentToday = todaysLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'healthy' && habit?.cost_per_unit) {
      return sum + (parseFloat(habit.cost_per_unit) * (log.quantity || 1));
    }
    return sum;
  }, 0);
  
  const totalSavedToday = todaysLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'unhealthy' && habit?.cost_per_unit) {
      // For unhealthy habits, we "save" money when we avoid them
      return sum + (parseFloat(habit.cost_per_unit) * (log.quantity || 1));
    }
    return sum;
  }, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                Habits
              </h1>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Add Habit</span>
              </button>
            </div>

            {/* View Mode Filter */}
            <div className="mb-6 flex space-x-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All Habits
              </button>
              <button
                onClick={() => setViewMode('healthy')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'healthy'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Healthy
              </button>
              <button
                onClick={() => setViewMode('unhealthy')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'unhealthy'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <TrendingDown className="w-4 h-4 mr-1" />
                Unhealthy
              </button>
            </div>

            <div className="space-y-6">
              {/* Overview Cards */}
              <HabitsOverview 
                healthyHabits={healthyHabits.length}
                unhealthyHabits={unhealthyHabits.length}
                completedToday={todaysLogs.length}
                totalSpentToday={totalSpentToday}
                totalSavedToday={totalSavedToday}
              />

              {/* Habits Grid */}
              <HabitsGrid
                habits={filteredHabits}
                habitLogs={habitLogs}
                onHabitClick={setSelectedHabit}
                onLogHabit={handleLogHabit}
                onUpdateHabit={handleUpdateHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      {/* Habit Detail Modal */}
      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          habitLogs={habitLogs.filter(log => log.habit_id === selectedHabit.id)}
          onClose={() => setSelectedHabit(null)}
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit}
          onLogHabit={handleLogHabit}
        />
      )}
    </div>
  );
}

export default Habits;