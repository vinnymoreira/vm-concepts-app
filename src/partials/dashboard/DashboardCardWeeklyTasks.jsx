import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const DashboardCardWeeklyTasks = () => {
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const columnTitles = ['Today', 'Tomorrow', 'This Week'];

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

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
        .eq('user_id', user.id)
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return CheckCircle2;
      default: return CheckCircle2;
    }
  };

  const getLabelColor = (label, index) => {
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-gray-500'];
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
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
      <div className="space-y-1">
        {columnTasks.slice(0, 4).map((task) => {
          const PriorityIcon = getPriorityIcon(task.priority);
          const dueDate = formatDueDate(task.due_date);
          const isOverdue = task.due_date && new Date(task.due_date) < new Date();
          
          return (
            <div 
              key={task.id}
              className="group p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <div className="flex items-start gap-2">
                <PriorityIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${task.title ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 italic'}`}>
                      {task.title || 'Untitled task'}
                    </span>
                    {task.priority !== 'none' && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)} bg-opacity-10`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                  
                  {/* Due date */}
                  {dueDate && (
                    <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{dueDate}</span>
                    </div>
                  )}
                  
                  {/* Labels */}
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {task.labels.slice(0, 2).map((label, index) => (
                        <span
                          key={index}
                          className={`text-xs px-1.5 py-0.5 rounded-full text-white ${getLabelColor(label, index)}`}
                        >
                          {label}
                        </span>
                      ))}
                      {task.labels.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{task.labels.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Checklist progress */}
                  {task.checklist_total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${(task.checklist_completed / task.checklist_total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.checklist_completed}/{task.checklist_total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {columnTasks.length > 4 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-1">
            +{columnTasks.length - 4} more tasks
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
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View All
          <span className="text-xs">→</span>
        </Link>
      </header>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {columnTitles.map((columnTitle) => {
          const columnTasks = tasks[columnTitle] || [];
          const urgentCount = columnTasks.filter(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date();
            return task.priority === 'high' || isOverdue;
          }).length;
          
          return (
            <div key={columnTitle} className="min-h-[120px]">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-100">
                  {columnTitle}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${columnTasks.length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                  {columnTasks.length}
                </span>
                {urgentCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {urgentCount}
                  </span>
                )}
              </div>
              {renderTaskList(columnTitle)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCardWeeklyTasks;