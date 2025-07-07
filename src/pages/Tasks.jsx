import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import TaskBoard from '../partials/tasks/TaskBoard';
import DailyTasksModal from '../partials/tasks/DailyTasksModal';
import { CirclePlus, Info } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

function Tasks() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDailyTasksModalOpen, setIsDailyTasksModalOpen] = useState(false);
  const [taskBoardKey, setTaskBoardKey] = useState(0);
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Get user and initialized from useAuth
  const { user, initialized } = useAuth();

  // ✅ Fixed useEffect with proper dependencies and cleanup
  useEffect(() => {
    let isMounted = true;

    const initializeTasks = async () => {
      if (!user || !initialized) {
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

        // Check if user has task columns, if not create default ones
        const { data: existingColumns, error: columnsError } = await supabase
          .from('task_columns')
          .select('*')
          .eq('user_id', user.id);

        if (columnsError) throw columnsError;

        // If no columns exist, create default ones
        if (!existingColumns || existingColumns.length === 0) {
          const defaultColumns = [
            { title: 'Today', position_x: 0, position_y: 0, user_id: user.id },
            { title: 'This Week', position_x: 1, position_y: 0, user_id: user.id },
            { title: 'Next Week', position_x: 2, position_y: 0, user_id: user.id },
            { title: 'Someday', position_x: 3, position_y: 0, user_id: user.id }
          ];

          const { error: insertError } = await supabase
            .from('task_columns')
            .insert(defaultColumns);

          if (insertError) throw insertError;
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing tasks:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeTasks();

    return () => {
      isMounted = false;
    };
  }, [user, initialized]);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setNotification(null), 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message) => {
    setNotification(message);
  };

  const handleAddDailyTasks = async () => {
    if (!user) {
      showNotification('You must be logged in to add daily tasks');
      return;
    }

    try {
      const { data: dailyTasks, error: dailyError } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('position');

      if (dailyError) throw dailyError;

      const { data: todayColumn, error: columnError } = await supabase
        .from('task_columns')
        .select('id')
        .eq('title', 'Today')
        .eq('user_id', user.id)  // ✅ Filter by user
        .single();

      if (columnError) throw columnError;

      const { data: existingTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('title')
        .eq('column_id', todayColumn.id)
        .eq('user_id', user.id);  // ✅ Filter by user

      if (tasksError) throw tasksError;

      const existingTitles = existingTasks.map(task => task.title);
      const tasksToAdd = dailyTasks.filter(task => !existingTitles.includes(task.title));

      if (tasksToAdd.length === 0) {
        showNotification('All daily tasks already exist in Today column');
        return;
      }

      const { data: lastTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('column_id', todayColumn.id)
        .eq('user_id', user.id)  // ✅ Filter by user
        .order('position', { ascending: false })
        .limit(1);

      const startPosition = lastTask && lastTask.length > 0 ? lastTask[0].position + 1 : 0;

      const newTasks = tasksToAdd.map((task, index) => ({
        title: task.title,
        column_id: todayColumn.id,
        position: startPosition + index,
        user_id: user.id  // ✅ Add user_id to new tasks
      }));

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(newTasks);

      if (insertError) throw insertError;

      setTaskBoardKey(prevKey => prevKey + 1);
      showNotification(`Added ${tasksToAdd.length} daily tasks to Today column`);
      
    } catch (err) {
      console.error('Error adding daily tasks:', err);
      showNotification('Error adding daily tasks');
    }
  };

  // ✅ Show loading while auth initializes
  if (!initialized) {
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
                  Please sign in to view your tasks.
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
              <span className="ml-2">Loading tasks...</span>
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
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <p className="mb-2 text-gray-500 text-xs text-right italic">
              <a href="#" onClick={() => setIsDailyTasksModalOpen(true)}>Manage daily tasks</a>
            </p>
            <div className="mb-8 flex justify-between">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Tasks</h1>
              <div className="flex items-center">
                <button 
                  onClick={handleAddDailyTasks}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <CirclePlus className="w-4 h-4 mr-2" />
                  <span>Add daily tasks</span>
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <TaskBoard key={taskBoardKey} />
            </div>
          </div>
        </main>

        {/* Toast Notification */}
        {notification && (
          <div 
            className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out transform 
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm">{notification}</span>
            </div>
          </div>
        )}
      </div>

      <DailyTasksModal 
        isOpen={isDailyTasksModalOpen}
        onClose={() => setIsDailyTasksModalOpen(false)}
      />
    </div>
  );
}

export default Tasks;