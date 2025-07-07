import React, { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, X, Trash2 } from 'lucide-react';
import TaskCard from './TaskCard';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const TaskColumn = ({ column, onTaskUpdate, onColumnDelete, onColumnUpdate, onTaskComplete, onTaskClick, selectedTaskIndex, isSelected, onStartInlineEdit, dragHandleProps }) => {
    const [isEditing, setIsEditing] = useState(column.title === '');
    const [title, setTitle] = useState(column.title);
    const [isAddingTasks, setIsAddingTasks] = useState(false);
    const titleInputRef = useRef(null);
    const isDoneColumn = column.title === 'Done';
    const { user } = useAuth();

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditing]);

    const handleClearAll = async () => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('column_id', column.id);

            if (error) throw error;
            
            onTaskUpdate(column.id, []);
        } catch (err) {
            console.error('Error clearing tasks:', err);
        }
    };

    const handleTaskComplete = async (taskId, destColumnId, newPosition) => {
        if (onTaskComplete) {
            onTaskComplete(taskId, column.id, destColumnId, newPosition);
        }
    };

    const handleTitleSave = async () => {
        const trimmedTitle = title.trim();
        if (trimmedTitle === '') return;
        if (trimmedTitle === column.title) {
            setIsEditing(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('task_columns')
                .update({ title: trimmedTitle })
                .eq('id', column.id)
                .select()
                .single();

            if (error) throw error;
            
            onColumnUpdate(column.id, { title: trimmedTitle });
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating column:', err);
            setTitle(column.title);
            setIsEditing(false);
        }
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            if (!column.title) {
                onColumnDelete(column.id);
            } else {
                setTitle(column.title);
                setIsEditing(false);
            }
        }
    };

    const handleTaskUpdate = async (updatedTask) => {
        // First update local state to keep UI responsive
        const updatedTasks = column.tasks.map(t => 
            t.id === updatedTask.id ? { ...t, title: updatedTask.title } : t
        );
        onTaskUpdate(column.id, updatedTasks);

        // If we're in rapid task creation mode and the task was completed successfully,
        // create a new task
        if (isAddingTasks && updatedTask.title.trim()) {
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .insert([{
                        title: '',
                        column_id: column.id,
                        position: column.tasks.length,
                        user_id: user.id,
                        description: '',
                        due_date: null,
                        priority: 'none',
                        labels: [],
                        checklist: [],
                        checklist_completed: 0,
                        checklist_total: 0,
                        comments_count: 0
                    }])
                    .select()
                    .single();

                if (error) throw error;

                onTaskUpdate(column.id, [...updatedTasks, data]);
            } catch (err) {
                console.error('Error adding next task:', err);
            }
        }
    };

    const handleAddTask = async () => {
        if (!user) {
            console.error('User not authenticated');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    title: '',
                    column_id: column.id,
                    position: column.tasks.length,
                    user_id: user.id,
                    description: '',
                    due_date: null,
                    priority: 'none',
                    labels: [],
                    checklist: [],
                    checklist_completed: 0,
                    checklist_total: 0,
                    comments_count: 0
                }])
                .select()
                .single();

            if (error) {
                console.error('Database error:', error);
                throw error;
            }
            
            const updatedTasks = [...column.tasks, data];
            onTaskUpdate(column.id, updatedTasks);
            setIsAddingTasks(true);
        } catch (err) {
            console.error('Error adding task:', err);
            alert('Failed to add task. Please try again.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            
            const updatedTasks = column.tasks.filter(task => task.id !== taskId);
            onTaskUpdate(column.id, updatedTasks);
            
            if (isAddingTasks && taskId === column.tasks[column.tasks.length - 1]?.id) {
                setIsAddingTasks(false);
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const exitAddingTasks = async () => {
        const lastTask = column.tasks[column.tasks.length - 1];
        if (lastTask && !lastTask.title.trim()) {
            await handleDeleteTask(lastTask.id);
        }
        setIsAddingTasks(false);
    };

    const handleTaskKeyDown = async (e) => {
        if (e.key === 'Escape' && isAddingTasks) {
            await exitAddingTasks();
        }
    };

    return (
        <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg ${
            isSelected ? 'ring-2 ring-gray-300 dark:ring-gray-600' : ''
        }`}>
            <div className="flex items-center justify-between p-4" {...dragHandleProps}>
                <div className="flex-grow" onClick={() => setIsEditing(true)}>
                    {isEditing ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyDown}
                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded p-1 outline-none"
                            placeholder="Enter column title..."
                        />
                    ) : (
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                            {column.title || 'Untitled Column'}
                        </h3>
                    )}
                </div>
                <button
                    onClick={() => onColumnDelete(column.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <Droppable droppableId={column.id.toString()} type="TASK">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-4 pt-0 space-y-2"
                    >
                        {column.tasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onUpdate={handleTaskUpdate}
                                onDelete={handleDeleteTask}
                                onComplete={handleTaskComplete}
                                onKeyDown={handleTaskKeyDown}
                                onTaskClick={onTaskClick}
                                isAddingTasks={isAddingTasks}
                                isSelected={selectedTaskIndex === index}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {isDoneColumn ? (
                <button
                    onClick={handleClearAll}
                    className="w-full p-4 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center rounded-b-lg"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                </button>
            ) : (
                <button
                    onClick={handleAddTask}
                    className="w-full p-4 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center rounded-b-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                </button>
            )}
        </div>
    );
};

export default TaskColumn;