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
        .order('position', { ascending: true, nullsFirst: false })
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
      // Get the current max position and add 1
      const maxPosition = habits.length > 0 ? Math.max(...habits.map(h => h.position || 0)) : -1;
      
      const { data, error } = await supabase
        .from('habits')
        .insert([{ 
          ...habitData, 
          user_id: user.id,
          position: maxPosition + 1
        }])  // ✅ Add user_id and position
        .select();

      if (error) throw error;

      setHabits(prev => [...prev, data[0]]);
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

  const handleLogHabit = async (habitId, quantity = 1, cost = null, logType = 'completed', customDate = null) => {
    if (!user) {
      setError('You must be logged in to log habits');
      return;
    }

    try {
      const logDate = customDate || new Date().toISOString().split('T')[0];
      
      const logData = {
        habit_id: habitId,
        user_id: user.id,
        log_date: logDate,
        quantity: quantity,
        cost: cost,
        notes: logType
      };
      
      const { data, error } = await supabase
        .from('habit_logs')
        .insert([logData])
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

  const handleUpdateLog = async (habitId, logDate, quantity, cost, logType) => {
    if (!user) {
      setError('You must be logged in to update logs');
      return;
    }

    try {
      const updateData = {
        quantity: quantity,
        cost: cost,
        notes: logType
      };

      const { data, error } = await supabase
        .from('habit_logs')
        .update(updateData)
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('log_date', logDate)
        .select();

      if (error) throw error;

      // Update local state
      setHabitLogs(prev => prev.map(log => 
        (log.habit_id === habitId && log.log_date === logDate) 
          ? { ...log, ...updateData }
          : log
      ));
      
      // Refresh habits to update streak counts
      fetchHabits();
    } catch (err) {
      console.error('Error updating log:', err);
      setError(err.message);
    }
  };

  const handleDeleteLog = async (habitId, logDate = null) => {
    if (!user) {
      setError('You must be logged in to delete logs');
      return;
    }

    try {
      const dateToDelete = logDate || new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('log_date', dateToDelete);

      if (error) throw error;

      // Remove from local state
      setHabitLogs(prev => prev.filter(log => 
        !(log.habit_id === habitId && log.log_date === dateToDelete)
      ));
      
      // Refresh habits to update streak counts
      fetchHabits();
    } catch (err) {
      console.error('Error deleting log:', err);
      setError(err.message);
    }
  };

  const handleReorderHabits = async (reorderedHabits) => {
    if (!user) {
      setError('You must be logged in to reorder habits');
      return;
    }

    try {
      // Update local state immediately for responsive UI
      setHabits(reorderedHabits);

      // Update position in database
      const updates = reorderedHabits.map((habit, index) => ({
        id: habit.id,
        position: index
      }));

      // Update all positions in a batch
      for (const update of updates) {
        await supabase
          .from('habits')
          .update({ position: update.position })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error reordering habits:', err);
      setError(err.message);
      // Revert to original order on error
      fetchHabits();
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
    if (habit?.cost_per_unit) {
      const cost = log.cost || (parseFloat(habit.cost_per_unit) * (log.quantity || 1));
      
      if (habit.category === 'healthy') {
        // For healthy habits, spending is always counted as spent
        return sum + cost;
      } else if (habit.category === 'unhealthy' && log.notes === 'slipped') {
        // For unhealthy habits, only count as spent if they slipped
        return sum + cost;
      }
    }
    return sum;
  }, 0);
  
  const totalSavedToday = todaysLogs.reduce((sum, log) => {
    const habit = habits.find(h => h.id === log.habit_id);
    if (habit?.category === 'unhealthy' && habit?.cost_per_unit && log.notes === 'success') {
      // For unhealthy habits, only count as saved if they successfully avoided
      const cost = log.cost || (parseFloat(habit.cost_per_unit) * (log.quantity || 1));
      return sum + cost;
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
            <div className="mb-8">
              <div className="sm:flex sm:justify-between sm:items-center mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">My Habits</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {filteredHabits.length} of {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Habit</span>
                </button>
              </div>

              {/* View Mode Filter */}
              <div className="flex justify-end mb-6">
                <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'all'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    All Habits
                  </button>
                  <button
                    onClick={() => setViewMode('healthy')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                      viewMode === 'healthy'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Healthy Habits
                  </button>
                  <button
                    onClick={() => setViewMode('unhealthy')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                      viewMode === 'unhealthy'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Vices to Avoid
                  </button>
                </div>
              </div>
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
                onDeleteLog={handleDeleteLog}
                onUpdateHabit={handleUpdateHabit}
                onDeleteHabit={handleDeleteHabit}
                onReorderHabits={handleReorderHabits}
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
          onDeleteLog={handleDeleteLog}
          onUpdateLog={handleUpdateLog}
          onLogHabit={handleLogHabit}
        />
      )}
    </div>
  );
}

export default Habits;