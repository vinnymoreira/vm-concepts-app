import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, GripVertical } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const DailyTasksModal = ({ isOpen, onClose }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const modalRef = useRef(null);

    useEffect(() => {
        fetchDailyTasks();
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        };

        const handleClickOutside = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
        };

        if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const fetchDailyTasks = async () => {
        try {
        const { data, error } = await supabase
            .from('daily_tasks')
            .select('*')
            .order('position');

        if (error) throw error;
        setTasks(data || []);
        } catch (err) {
        console.error('Error fetching daily tasks:', err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
        const newPosition = tasks.length;
        const { data, error } = await supabase
            .from('daily_tasks')
            .insert([{ 
            title: newTask.trim(),
            position: newPosition
            }])
            .select()
            .single();

        if (error) throw error;
        setTasks([...tasks, data]);
        setNewTask('');
        } catch (err) {
        console.error('Error adding daily task:', err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
        const { error } = await supabase
            .from('daily_tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
        setTasks(tasks.filter(task => task.id !== taskId));
        } catch (err) {
        console.error('Error deleting daily task:', err);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(tasks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTasks(items);

        try {
        const updates = items.map((task, index) => ({
            id: task.id,
            position: index,
            title: task.title
        }));

        const { error } = await supabase
            .from('daily_tasks')
            .upsert(updates);

        if (error) throw error;
        } catch (err) {
        console.error('Error updating task positions:', err);
        fetchDailyTasks();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md"
        >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Manage Daily Tasks
            </h2>
            <button 
                onClick={onClose} 
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
                <X className="w-5 h-5" />
            </button>
            </div>

            <div className="p-4">
            <form onSubmit={handleAddTask} className="mb-4">
                <div className="flex gap-2">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter a daily task..."
                    className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                    type="submit"
                    className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                    <Plus className="w-4 h-4" />
                </button>
                </div>
            </form>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="daily-tasks">
                {(provided) => (
                    <ul 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                    >
                    {tasks.map((task, index) => (
                        <Draggable 
                        key={task.id} 
                        draggableId={task.id.toString()} 
                        index={index}
                        >
                        {(provided, snapshot) => (
                            <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded
                                ${snapshot.isDragging ? 'opacity-70' : ''}`}
                            style={{
                                width: 'calc(100% - 48px)',
                                ...provided.draggableProps.style
                            }}
                            >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span 
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab flex-shrink-0"
                                >
                                <GripVertical className="w-4 h-4" />
                                </span>
                                <span className="text-gray-800 dark:text-gray-100 truncate">
                                {task.title}
                                </span>
                            </div>
                            <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-500 hover:text-red-600 ml-2 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            </li>
                        )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    </ul>
                )}
                </Droppable>
            </DragDropContext>
            </div>
        </div>
        </div>
    );
};

export default DailyTasksModal;