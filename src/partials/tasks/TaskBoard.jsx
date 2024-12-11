import React, { useState, useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import TaskColumn from './TaskColumn';
import { useAuth } from '../../context/AuthContext';

const TaskBoard = () => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);

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

    const fetchColumns = async () => {
        try {
            setLoading(true);
            // console.log('Fetching columns for user:', user.id); // Debug log
            
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

            // console.log('Fetched data:', { columnsData, tasksData }); // Debug log

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
        console.log('TaskBoard handling complete:', { taskId, sourceColumnId, destColumnId, newPosition });
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

    if (!user) {
        return <div className="flex items-center justify-center p-4">Please log in to view your tasks.</div>;
    }

    if (loading) {
        return <div className="flex items-center justify-center p-4">Loading board...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center p-4 text-red-500">Error: {error}</div>;
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
        </DragDropContext>
    );
};

export default TaskBoard;