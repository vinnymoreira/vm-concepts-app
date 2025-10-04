import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { X, Check, Calendar, Clock, Tag, MessageSquare, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const TaskCard = ({ task, index, onUpdate, onDelete, onComplete, onKeyDown, isAddingTasks, onTaskClick, isSelected }) => {
    const [isEditing, setIsEditing] = useState(task.title === '');
    const [title, setTitle] = useState(task.title);
    const [availableLabels, setAvailableLabels] = useState([]);
    const inputRef = useRef(null);
    const isNewTask = task.title === '';
    const { user } = useAuth();

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Listen for inline edit events from keyboard shortcuts
    useEffect(() => {
        const handleInlineEdit = (e) => {
            if (e.detail && e.detail.taskId === task.id) {
                setIsEditing(true);
            }
        };

        document.addEventListener('startInlineEdit', handleInlineEdit);
        return () => document.removeEventListener('startInlineEdit', handleInlineEdit);
    }, [task.id]);

    // Update local state when task prop changes
    useEffect(() => {
        setTitle(task.title);
    }, [task.title]);

    // Fetch available labels for proper display
    useEffect(() => {
        if (user && task.labels && task.labels.length > 0) {
            fetchLabels();
        }
    }, [user, task.labels]);

    const fetchLabels = async () => {
        try {
            const { data, error } = await supabase
                .from('task_labels')
                .select('*')
                .eq('user_id', user.id)
                .in('id', task.labels);

            if (error) throw error;
            setAvailableLabels(data || []);
        } catch (error) {
            console.error('Error fetching labels:', error);
        }
    };

    const handleSave = async (newTitle) => {
        const trimmedTitle = newTitle.trim();
        
        if (isNewTask && !trimmedTitle) {
            onDelete(task.id);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tasks')
                .update({ title: trimmedTitle })
                .eq('id', task.id)
                .select()
                .single();

            if (error) throw error;
            
            setTitle(trimmedTitle);
            onUpdate(data);
        } catch (err) {
            console.error('Error updating task:', err);
            setTitle(task.title);
        }
        
        setIsEditing(false);
    };

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await handleSave(title);
        } else if (e.key === 'Escape') {
            if (isNewTask) {
                onDelete(task.id);
            } else {
                setTitle(task.title);
                setIsEditing(false);
            }
        }
        if (onKeyDown) {
            onKeyDown(e);
        }
    };

    const handleBlur = async (e) => {
        if (e.relatedTarget && (
            e.relatedTarget.classList.contains('delete-button') || 
            e.relatedTarget.classList.contains('complete-button') ||
            e.relatedTarget.closest('.delete-button') || 
            e.relatedTarget.closest('.complete-button')
        )) {
            return;
        }
        await handleSave(title);
    };

    const handleClickOutside = (e) => {
        if (isEditing && inputRef.current && !inputRef.current.contains(e.target)) {
            handleSave(title);
        }
    };

    useEffect(() => {
        if (isEditing) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isEditing, title]);

    const handleCompleteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // Get the "Done" column
            const { data: doneColumn, error: columnError } = await supabase
                .from('task_columns')
                .select('id')
                .eq('title', 'Done')
                .single();
    
    
            if (columnError) {
                console.error('Error finding Done column:', columnError);
                return;
            }
    
            // Get highest position in Done column
            const { data: lastTask, error: posError } = await supabase
                .from('tasks')
                .select('position')
                .eq('column_id', doneColumn.id)
                .order('position', { ascending: false })
                .limit(1);
    
            if (posError) {
                console.error('Error getting last position:', posError);
                return;
            }
    
            const newPosition = lastTask?.[0] ? lastTask[0].position + 1 : 0;
    
            // Update the task
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    column_id: doneColumn.id,
                    position: newPosition 
                })
                .eq('id', task.id);
    
            if (updateError) {
                console.error('Error updating task:', updateError);
                return;
            }
    
            // Call the onComplete handler to update UI
            if (onComplete) {
                await onComplete(task.id, doneColumn.id, newPosition);
            }
    
        } catch (err) {
            console.error('Error completing task:', err);
        }
    };

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(task.id);
    };

    // Helper function to get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'border-l-red-500';
            case 'medium': return 'border-l-yellow-500';
            case 'low': return 'border-l-green-500';
            default: return 'border-l-gray-300 dark:border-l-gray-600';
        }
    };

    // Helper function to format due date
    const formatDueDate = (dueDate) => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays <= 7) return `${diffDays} days`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Helper function to get due date color
    const getDueDateColor = (dueDate) => {
        if (!dueDate) return 'text-gray-500';
        const date = new Date(dueDate);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'text-red-500'; // Overdue
        if (diffDays === 0) return 'text-orange-500'; // Today
        if (diffDays <= 3) return 'text-yellow-500'; // Soon
        return 'text-gray-500'; // Normal
    };


    return (
        <Draggable draggableId={task.id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm  
                        ${getPriorityColor(task.priority)}
                        ${snapshot.isDragging 
                            ? 'shadow-xl scale-105 rotate-2 z-50' 
                            : 'hover:shadow-md'
                        }
                        ${isSelected ? 'ring-1 ring-gray-300 dark:ring-gray-600' : ''}
                        ${snapshot.isDragging ? '' : 'transition-shadow duration-200 ease-in-out'}
                        cursor-pointer`}
                >
                    {/* Task Content */}
                    <div className="px-3 py-2">
                        {/* Main Task Title */}
                        <div className="flex items-start justify-between gap-2">
                            {isEditing ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    className="flex-grow bg-transparent border-none rounded-md h-8 px-2 outline-none focus:bg-gray-50 dark:focus:bg-gray-700/50 transition-colors duration-200 font-medium text-gray-900 dark:text-gray-100"
                                    placeholder="Enter task title..."
                                />
                            ) : (
                                <h3 
                                    className="flex-grow text-gray-900 dark:text-gray-100 font-medium leading-snug cursor-pointer"
                                    onClick={(e) => {
                                        if (snapshot.isDragging) return;
                                        if (e.detail === 1) {
                                            // Single click - open modal
                                            onTaskClick?.(task);
                                        } else if (e.detail === 2) {
                                            // Double click - edit inline
                                            setIsEditing(true);
                                        }
                                    }}
                                >
                                    {title}
                                </h3>
                            )}
                            
                            {/* Quick Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={handleCompleteClick}
                                    className="complete-button p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors duration-200"
                                    title="Mark as complete"
                                >
                                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="delete-button p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                                    title="Delete task"
                                >
                                    <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Task Description (if available) */}
                        {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {task.description}
                            </p>
                        )}

                        {/* Task Metadata */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Due Date */}
                                {task.due_date && (
                                    <div className={`flex items-center gap-1 text-xs ${getDueDateColor(task.due_date)}`}>
                                        <Calendar className="w-3 h-3" />
                                        <span className="font-medium">{formatDueDate(task.due_date)}</span>
                                    </div>
                                )}

                                {/* Priority Badge */}
                                {task.priority && task.priority !== 'none' && (
                                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium
                                        ${task.priority === 'high' 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                                            : task.priority === 'medium'
                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                        }`}>
                                        <span>{task.priority}</span>
                                    </div>
                                )}

                                {/* Labels/Tags */}
                                {availableLabels.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {availableLabels.slice(0, 3).map((label) => (
                                            <span
                                                key={label.id}
                                                className="inline-block w-8 h-3 rounded-sm"
                                                style={{ backgroundColor: label.color }}
                                                title={label.name}
                                            />
                                        ))}
                                        {availableLabels.length > 3 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                                                +{availableLabels.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Additional indicators */}
                            <div className="flex items-center gap-2">
                                {/* Comments indicator */}
                                {task.comments_count > 0 && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <MessageSquare className="w-3 h-3" />
                                        <span className="text-xs">{task.comments_count}</span>
                                    </div>
                                )}

                                {/* Checklist progress */}
                                {task.checklist_total > 0 && (
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <div className="text-xs font-medium">
                                            {task.checklist_completed}/{task.checklist_total}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;