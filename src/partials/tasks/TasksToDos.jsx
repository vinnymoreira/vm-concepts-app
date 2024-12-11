import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function TasksToDos() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [taskInput, setTaskInput] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (editingTask !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTask]);

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && taskInput.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: taskInput.trim(), completed: false }]);
      setTaskInput('');
    }
  };

  const handleRemoveTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    if (editingTask?.id === taskId) {
      setEditingTask(null);
    }
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTasks(items);
  };

  const startEditing = (task) => {
    setEditingTask(task);
  };

  const handleEditChange = (e) => {
    setEditingTask(prev => ({ ...prev, text: e.target.value }));
  };

  const handleEditSubmit = () => {
    if (!editingTask || !editingTask.text.trim()) return;

    setTasks(tasks.map(task =>
      task.id === editingTask.id ? { ...task, text: editingTask.text.trim() } : task
    ));
    setEditingTask(null);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditingTask(null);
    }
  };

  const renderTaskList = (completed) => {
    const filteredTasks = tasks.filter(task => task.completed === completed);
    
    return (
      <Droppable droppableId={completed ? 'completed' : 'pending'}>
        {(provided) => (
          <ul
            className="list-disc pl-5 mb-4"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {filteredTasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex items-center mb-2 transition-all ${
                      snapshot.isDragging ? 'opacity-50' : ''
                    }`}
                  >
                    <span
                      {...provided.dragHandleProps}
                      className="cursor-grab mr-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-gray-500 hover:text-gray-700"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="4" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="20" r="2" />
                      </svg>
                    </span>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                      className="mr-2 cursor-pointer"
                    />
                    {editingTask?.id === task.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTask.text}
                        onChange={handleEditChange}
                        onBlur={handleEditSubmit}
                        onKeyDown={handleEditKeyDown}
                        className="flex-grow bg-transparent border-b border-gray-300 focus:outline-none text-gray-700 dark:text-gray-300"
                      />
                    ) : (
                      <span
                        className="flex-grow text-gray-700 dark:text-gray-300 cursor-pointer"
                        onClick={() => startEditing(task)}
                      >
                        {task.text}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    );
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            To Do's
          </h2>
        </header>

        <div className="mb-4">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={handleAddTask}
            placeholder="Start typing new tasks..."
            className="w-full p-2 mb-2 bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Pending Tasks
            </h3>
            {renderTaskList(false)}

            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Done Tasks
            </h3>
            {renderTaskList(true)}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

export default TasksToDos;