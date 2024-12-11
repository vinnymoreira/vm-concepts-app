import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { X, Check } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const TaskCard = ({ task, index, onUpdate, onDelete, onComplete, onKeyDown, isAddingTasks }) => {
    const [isEditing, setIsEditing] = useState(task.title === '');
    const [title, setTitle] = useState(task.title);
    const inputRef = useRef(null);
    const isNewTask = task.title === '';

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Update local state when task prop changes
    useEffect(() => {
        setTitle(task.title);
    }, [task.title]);

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

    const handleCompleteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Complete button clicked for task:', task.id);
        
        try {
            // Get the "Done" column
            const { data: doneColumn, error: columnError } = await supabase
                .from('task_columns')
                .select('id')
                .eq('title', 'Done')
                .single();
    
            console.log('Found Done column:', doneColumn);
    
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

    return (
        <Draggable draggableId={task.id.toString()} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group bg-white dark:bg-gray-800 rounded-lg shadow p-3 
                        ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                >
                    <div className="flex items-center justify-between gap-2">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="flex-grow bg-transparent border-none rounded h-8 px-2 outline-none focus:bg-gray-50 dark:focus:bg-gray-700/50 transition-all duration-200"
                                placeholder="Enter task title..."
                            />
                        ) : (
                            <span 
                                className="flex-grow text-gray-800 dark:text-gray-100 cursor-pointer"
                                onClick={() => !snapshot.isDragging && setIsEditing(true)}
                            >
                                {title}
                            </span>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleCompleteClick}
                                className="complete-button p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                            >
                                <Check className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className="delete-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;