import React, { useState, useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import TaskColumn from './TaskColumn';
import TaskDetailModal from './TaskDetailModal';
import EmptyTaskBoard from './EmptyTaskBoard';
import { useAuth } from '../../context/AuthContext';

const TaskBoard = () => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
    const [selectedColumnIndex, setSelectedColumnIndex] = useState(null);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (user && isVisible) {
            // Only fetch if the tab becomes visible AND we don't have data yet
            if (!columns.length) {
                fetchColumns();
            }
        }
    }, [user, isVisible]);


    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts if user is typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // Don't trigger if modal is open (modal has its own shortcuts)
            if (isDetailModalOpen) {
                return;
            }

            // Mac-specific shortcuts (using Cmd key)
            if (e.metaKey) {
                switch (e.key) {
                    case 'k': // Cmd+K: Add new column
                        e.preventDefault();
                        handleAddColumn();
                        break;
                    case '/': // Cmd+/: Show keyboard shortcuts help
                        e.preventDefault();
                        setShowKeyboardHelp(true);
                        break;
                }
                return;
            }

            // Navigation shortcuts (without modifiers)
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    // If no navigation has started, start with first column
                    if (selectedColumnIndex === null) {
                        if (columns.length > 0) {
                            setSelectedColumnIndex(0);
                            if (columns[0].tasks.length > 0) {
                                setSelectedTaskIndex(0);
                            }
                        }
                        break;
                    }
                    const newLeftColumnIndex = Math.max(0, selectedColumnIndex - 1);
                    setSelectedColumnIndex(newLeftColumnIndex);
                    // Select first task of the new column if it has tasks, otherwise just highlight column
                    if (columns[newLeftColumnIndex]?.tasks.length > 0) {
                        setSelectedTaskIndex(0);
                    } else {
                        setSelectedTaskIndex(null);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    // If no navigation has started, start with first column
                    if (selectedColumnIndex === null) {
                        if (columns.length > 0) {
                            setSelectedColumnIndex(0);
                            if (columns[0].tasks.length > 0) {
                                setSelectedTaskIndex(0);
                            }
                        }
                        break;
                    }
                    const newRightColumnIndex = Math.min(columns.length - 1, selectedColumnIndex + 1);
                    setSelectedColumnIndex(newRightColumnIndex);
                    // Select first task of the new column if it has tasks, otherwise just highlight column
                    if (columns[newRightColumnIndex]?.tasks.length > 0) {
                        setSelectedTaskIndex(0);
                    } else {
                        setSelectedTaskIndex(null);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    // If no navigation has started, start with first column that has tasks
                    if (selectedColumnIndex === null) {
                        for (let i = 0; i < columns.length; i++) {
                            if (columns[i].tasks.length > 0) {
                                setSelectedColumnIndex(i);
                                setSelectedTaskIndex(0);
                                break;
                            }
                        }
                        break;
                    }
                    if (columns[selectedColumnIndex]?.tasks.length > 0) {
                        setSelectedTaskIndex(prev => {
                            const maxIndex = columns[selectedColumnIndex].tasks.length - 1;
                            return prev === null ? 0 : Math.min(maxIndex, prev + 1);
                        });
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    // If no navigation has started, start with first column that has tasks
                    if (selectedColumnIndex === null) {
                        for (let i = 0; i < columns.length; i++) {
                            if (columns[i].tasks.length > 0) {
                                setSelectedColumnIndex(i);
                                setSelectedTaskIndex(0);
                                break;
                            }
                        }
                        break;
                    }
                    if (columns[selectedColumnIndex]?.tasks.length > 0) {
                        setSelectedTaskIndex(prev => {
                            return prev === null || prev === 0 ? null : prev - 1;
                        });
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedTaskIndex !== null && columns[selectedColumnIndex]?.tasks[selectedTaskIndex]) {
                        handleTaskClick(columns[selectedColumnIndex].tasks[selectedTaskIndex]);
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    if (selectedTaskIndex !== null && columns[selectedColumnIndex]?.tasks[selectedTaskIndex]) {
                        handleDeleteSelectedTask();
                    }
                    break;
                case 'c': // C: Mark task as complete
                    e.preventDefault();
                    if (selectedTaskIndex !== null && columns[selectedColumnIndex]?.tasks[selectedTaskIndex]) {
                        handleCompleteSelectedTask();
                    }
                    break;
                case 'n': // N: Add new task to current column
                    e.preventDefault();
                    if (columns.length > 0) {
                        // If no column is selected, default to first column
                        const targetColumnIndex = selectedColumnIndex !== null ? selectedColumnIndex : 0;
                        handleAddTaskToColumn(targetColumnIndex);
                        // Update selection to the new column if none was selected
                        if (selectedColumnIndex === null) {
                            setSelectedColumnIndex(0);
                        }
                    }
                    break;
                case 'e': // E: Edit selected task title inline
                    e.preventDefault();
                    if (selectedTaskIndex !== null && columns[selectedColumnIndex]?.tasks[selectedTaskIndex]) {
                        const task = columns[selectedColumnIndex].tasks[selectedTaskIndex];
                        // Trigger inline edit mode on the selected task
                        const editEvent = new CustomEvent('startInlineEdit', { 
                            detail: { taskId: task.id } 
                        });
                        document.dispatchEvent(editEvent);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setSelectedTaskIndex(null);
                    setSelectedColumnIndex(null);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [columns, selectedColumnIndex, selectedTaskIndex, isDetailModalOpen]);

    const fetchColumns = async () => {
        try {
            setLoading(true);
            
            // First fetch columns
            const { data: columnsData, error: columnsError } = await supabase
                .from('task_columns')
                .select('*')
                .eq('user_id', user.id)  // Add this line
                .order('position_y, position_x');

            if (columnsError) {
                console.error('Columns fetch error:', columnsError); // Debug log
                throw columnsError;
            }

            // Then fetch tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)  // Add this line
                .order('position');

            if (tasksError) {
                console.error('Tasks fetch error:', tasksError); // Debug log
                throw tasksError;
            }


            const organizedColumns = columnsData.map(column => ({
                ...column,
                tasks: tasksData.filter(task => task.column_id === column.id)
                    .sort((a, b) => a.position - b.position)
            }));

            setColumns(organizedColumns);
        } catch (err) {
            console.error('Error fetching board data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskComplete = async (taskId, sourceColumnId, destColumnId, newPosition) => {
        try {
            const sourceColumn = columns.find(col => col.id === sourceColumnId);
            const destColumn = columns.find(col => col.id === destColumnId);
            
            if (!sourceColumn || !destColumn) {
                console.error('Could not find columns:', { sourceColumn, destColumn });
                return;
            }
    
            // Find the task and create new task lists
            const taskToMove = sourceColumn.tasks.find(task => task.id === taskId);
            const newSourceTasks = sourceColumn.tasks.filter(task => task.id !== taskId);
            const newDestTasks = [...destColumn.tasks, { ...taskToMove, column_id: destColumnId, position: newPosition }];
    
            // Update the columns state
            setColumns(columns.map(col => {
                if (col.id === sourceColumnId) {
                    return { ...col, tasks: newSourceTasks };
                }
                if (col.id === destColumnId) {
                    return { ...col, tasks: newDestTasks };
                }
                return col;
            }));
    
        } catch (err) {
            console.error('Error updating task completion:', err);
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, type } = result;
        
        if (!destination) return;
        if (destination.droppableId === source.droppableId && 
            destination.index === source.index) return;
    
        try {
            if (type === 'COLUMN') {
                const newColumns = Array.from(columns);
                const [removed] = newColumns.splice(source.index, 1);
                newColumns.splice(destination.index, 0, removed);
    
                setColumns(newColumns);
    
                const updates = newColumns.map((column, index) => ({
                    id: column.id,
                    position_x: index % 6,
                    position_y: Math.floor(index / 6),
                    title: column.title,
                    user_id: user.id  // Add this line
                }));
    
                const { error } = await supabase
                    .from('task_columns')
                    .upsert(updates);
    
                if (error) throw error;
            }

            if (type === 'TASK') {
                const sourceCol = columns.find(col => col.id.toString() === source.droppableId);
                const destCol = columns.find(col => col.id.toString() === destination.droppableId);
                
                if (!sourceCol || !destCol) return;
    
                const newColumns = Array.from(columns);
                const sourceColIndex = newColumns.findIndex(col => col.id.toString() === source.droppableId);
                const destColIndex = newColumns.findIndex(col => col.id.toString() === destination.droppableId);
                
                const newSourceTasks = Array.from(sourceCol.tasks);
                const newDestTasks = sourceCol === destCol ? 
                    newSourceTasks : 
                    Array.from(destCol.tasks);
    
                const [movedTask] = newSourceTasks.splice(source.index, 1);
    
                if (sourceCol === destCol) {
                    newSourceTasks.splice(destination.index, 0, movedTask);
                } else {
                    newDestTasks.splice(destination.index, 0, { ...movedTask, column_id: destCol.id });
                }
    
                newColumns[sourceColIndex] = {
                    ...sourceCol,
                    tasks: newSourceTasks
                };
                
                if (sourceCol !== destCol) {
                    newColumns[destColIndex] = {
                        ...destCol,
                        tasks: newDestTasks
                    };
                }
    
                setColumns(newColumns);
    
                let updates = [];
                if (sourceCol === destCol) {
                    updates = newSourceTasks.map((task, index) => ({
                        id: task.id,
                        position: index,
                        column_id: sourceCol.id,
                        title: task.title,
                        user_id: user.id  // Add this line
                    }));
                } else {
                    updates = [
                        ...newSourceTasks.map((task, index) => ({
                            id: task.id,
                            position: index,
                            column_id: sourceCol.id,
                            title: task.title,
                            user_id: user.id  // Add this line
                        })),
                        ...newDestTasks.map((task, index) => ({
                            id: task.id,
                            position: index,
                            column_id: destCol.id,
                            title: task.title,
                            user_id: user.id  // Add this line
                        }))
                    ];
                }
    
                const { error } = await supabase
                    .from('tasks')
                    .upsert(updates);
    
                if (error) throw error;
            }
        } catch (err) {
            console.error('Error updating positions:', err);
            fetchColumns(); // Refresh the board on error
        }
    };

    const handleAddColumn = async () => {
        try {
            const newColumn = {
                title: '',
                position_x: columns.length % 6,
                position_y: Math.floor(columns.length / 6),
                user_id: user.id  // Add this line
            };

            const { data, error } = await supabase
                .from('task_columns')
                .insert([newColumn])
                .select()
                .single();

            if (error) throw error;
            setColumns([...columns, { ...data, tasks: [] }]);
        } catch (err) {
            console.error('Error adding column:', err);
            setError(err.message);
        }
    };

    const handleColumnUpdate = (columnId, updatedData) => {
        setColumns(prevColumns => 
            prevColumns.map(col => 
                col.id === columnId ? { ...col, ...updatedData } : col
            )
        );
    };

    const handleColumnDelete = async (columnId) => {
        try {
            const { error } = await supabase
                .from('task_columns')
                .delete()
                .eq('id', columnId)
                .eq('user_id', user.id);  // Add this line
            
            if (error) throw error;
            setColumns(columns.filter(col => col.id !== columnId));
        } catch (err) {
            console.error('Error deleting column:', err);
            setError(err.message);
        }
    };

    const handleTaskUpdate = (columnId, updatedTasks) => {
        setColumns(columns.map(col => 
            col.id === columnId ? { ...col, tasks: updatedTasks } : col
        ));
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    };

    const handleTaskDetailUpdate = (updatedTask) => {
        setColumns(columns.map(col => ({
            ...col,
            tasks: col.tasks.map(task => 
                task.id === updatedTask.id ? updatedTask : task
            )
        })));
        setSelectedTask(updatedTask);
    };

    const handleTaskDetailDelete = (taskId) => {
        setColumns(columns.map(col => ({
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
        })));
        setIsDetailModalOpen(false);
        setSelectedTask(null);
    };

    const handleAddTaskToColumn = async (columnIndex) => {
        if (!user || !columns[columnIndex]) return;

        const column = columns[columnIndex];
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
            
            const updatedTasks = [...column.tasks, data];
            handleTaskUpdate(column.id, updatedTasks);
            setSelectedTaskIndex(updatedTasks.length - 1);
        } catch (err) {
            console.error('Error adding task:', err);
        }
    };

    const handleDeleteSelectedTask = async () => {
        if (selectedTaskIndex === null || !columns[selectedColumnIndex]?.tasks[selectedTaskIndex]) return;

        const task = columns[selectedColumnIndex].tasks[selectedTaskIndex];
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id);

            if (error) throw error;
            
            const updatedTasks = columns[selectedColumnIndex].tasks.filter(t => t.id !== task.id);
            handleTaskUpdate(columns[selectedColumnIndex].id, updatedTasks);
            
            // Adjust selected task index
            setSelectedTaskIndex(prev => {
                if (updatedTasks.length === 0) return null;
                return prev >= updatedTasks.length ? updatedTasks.length - 1 : prev;
            });
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const handleCompleteSelectedTask = async () => {
        if (selectedTaskIndex === null || !columns[selectedColumnIndex]?.tasks[selectedTaskIndex]) return;

        const task = columns[selectedColumnIndex].tasks[selectedTaskIndex];
        try {
            // Find the "Done" column
            const doneColumn = columns.find(col => col.title === 'Done');
            if (!doneColumn) {
                console.error('No "Done" column found');
                return;
            }

            // Get highest position in Done column
            const newPosition = doneColumn.tasks.length;

            // Update the task
            const { error } = await supabase
                .from('tasks')
                .update({ 
                    column_id: doneColumn.id,
                    position: newPosition 
                })
                .eq('id', task.id);

            if (error) throw error;

            // Update UI
            handleTaskComplete(task.id, columns[selectedColumnIndex].id, doneColumn.id, newPosition);
            
            // Adjust selected task index
            setSelectedTaskIndex(prev => {
                const remainingTasks = columns[selectedColumnIndex].tasks.length - 1;
                if (remainingTasks === 0) return null;
                return prev >= remainingTasks ? remainingTasks - 1 : prev;
            });
        } catch (err) {
            console.error('Error completing task:', err);
        }
    };

    const handleStartInlineEdit = (taskId) => {
        // This will be handled by the TaskColumn to trigger inline edit mode
        // We'll pass this function down to enable keyboard-triggered inline editing
    };

    if (!user) {
        return <div className="flex items-center justify-center p-4">Please log in to view your tasks.</div>;
    }

    if (loading) {
        return <div className="flex items-center justify-center p-4">Loading board...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center p-4 text-red-500">Error: {error}</div>;
    }

    // Show empty state when no columns exist
    if (columns.length === 0) {
        return <EmptyTaskBoard onAddColumn={handleAddColumn} />;
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" type="COLUMN" direction="horizontal">
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 min-h-[200px]"
                    >
                        {columns.map((column, index) => (
                            <Draggable 
                                key={column.id.toString()} 
                                draggableId={column.id.toString()} 
                                index={index}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={snapshot.isDragging ? 'opacity-50' : ''}
                                    >
                                        <TaskColumn
                                            column={column}
                                            dragHandleProps={provided.dragHandleProps}
                                            onTaskUpdate={handleTaskUpdate}
                                            onColumnDelete={handleColumnDelete}
                                            onColumnUpdate={handleColumnUpdate}
                                            onTaskComplete={handleTaskComplete}
                                            onTaskClick={handleTaskClick}
                                            selectedTaskIndex={index === selectedColumnIndex ? selectedTaskIndex : null}
                                            isSelected={index === selectedColumnIndex && selectedTaskIndex === null && selectedColumnIndex !== null}
                                            onStartInlineEdit={handleStartInlineEdit}
                                            key={column.id}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        <button
                            onClick={handleAddColumn}
                            className="h-16 flex items-center justify-center border rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Plus className="w-6 h-6 mr-2" />
                            Add Column
                        </button>
                    </div>
                )}
            </Droppable>
            
            {/* Task Detail Modal */}
            <TaskDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onUpdate={handleTaskDetailUpdate}
                onDelete={handleTaskDetailDelete}
            />

            {/* Keyboard Shortcuts Help Modal */}
            {showKeyboardHelp && (
                <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Keyboard Shortcuts
                            </h2>
                            <button
                                onClick={() => setShowKeyboardHelp(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Navigation
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Move between columns</span>
                                            <div className="flex gap-1">
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">←</kbd>
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">→</kbd>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Navigate tasks in column</span>
                                            <div className="flex gap-1">
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">↑</kbd>
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">↓</kbd>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Clear selection</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Task Actions
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Open selected task</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Delete selected task</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Delete</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Mark task as complete</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">C</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Edit selected task title</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">E</kbd>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Creation
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Add new task</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">N</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Add new column</span>
                                            <div className="flex gap-1">
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘</kbd>
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">K</kbd>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Task Detail Modal
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Edit title</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">E</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Edit description</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">D</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Edit due date</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">U</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Edit priority</span>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">P</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Delete task</span>
                                            <div className="flex gap-1">
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘</kbd>
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Delete</kbd>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                        Help
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 dark:text-gray-300">Show this help</span>
                                            <div className="flex gap-1">
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘</kbd>
                                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">/</kbd>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DragDropContext>
    );
};

export default TaskBoard;