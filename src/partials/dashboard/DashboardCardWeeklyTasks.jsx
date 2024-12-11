import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const DashboardCardWeeklyTasks = () => {
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const columnTitles = ['Today', 'Tomorrow', 'This Week'];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // First, get the column IDs for Today, Tomorrow, and This Week
      const { data: columns, error: columnsError } = await supabase
        .from('task_columns')
        .select('id, title')
        .in('title', columnTitles)
        .eq('user_id', user.id);

      if (columnsError) throw columnsError;

      // Then get tasks for these columns
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('column_id', columns.map(col => col.id))
        .order('position');

      if (tasksError) throw tasksError;

      // Organize tasks by column
      const organizedTasks = columns.reduce((acc, column) => {
        acc[column.title] = tasksData.filter(task => task.column_id === column.id);
        return acc;
      }, {});

      setTasks(organizedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTaskList = (columnTitle) => {
    const columnTasks = tasks[columnTitle] || [];
    
    if (columnTasks.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No tasks
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {columnTasks.slice(0, 3).map((task) => (
          <div 
            key={task.id}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
            <span>{task.title}</span>
          </div>
        ))}
        {columnTasks.length > 3 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            +{columnTasks.length - 3} more tasks
          </div>
        )}
      </div>
    );
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
          Error loading tasks: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Weekly Tasks</h2>
        <Link 
          to="/tasks" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All
        </Link>
      </header>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {columnTitles.map((columnTitle) => (
          <div key={columnTitle}>
            <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-3">
              {columnTitle}
            </h3>
            {renderTaskList(columnTitle)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardCardWeeklyTasks;