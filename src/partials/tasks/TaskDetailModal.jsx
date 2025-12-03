import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, MessageSquare, Plus, Trash2, Check, Edit3 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import LabelSelector from './LabelSelector';
import LabelManagementModal from './LabelManagementModal';
import DatePicker from '../../components/Datepicker';

const TaskDetailModal = ({ isOpen, onClose, task, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'none',
        labels: []
    });
    const [checklist, setChecklist] = useState([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [isLabelManagementOpen, setIsLabelManagementOpen] = useState(false);
    const [availableLabels, setAvailableLabels] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (task && isOpen) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                priority: task.priority || 'none',
                labels: task.labels || []
            });
            setChecklist(task.checklist || []);
            setEditingField(null);
            fetchLabels();
        }
    }, [task, isOpen]);

    const fetchLabels = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('task_labels')
                .select('*')
                .eq('user_id', user.id)
                .order('position', { ascending: true });

            if (error) throw error;
            setAvailableLabels(data || []);
        } catch (error) {
            console.error('Error fetching labels:', error);
        }
    };

    // Handle escape key and click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Escape key handling
            if (e.key === 'Escape') {
                if (editingField) {
                    setEditingField(null);
                } else {
                    onClose();
                }
                return;
            }

            // Don't trigger shortcuts if user is typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // Number keys (1-9) for label shortcuts
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const labelIndex = parseInt(e.key) - 1;
                if (labelIndex < availableLabels.length) {
                    const label = availableLabels[labelIndex];
                    toggleLabel(label.id);
                }
                return;
            }

            // Modal-specific shortcuts
            switch (e.key) {
                case 'e': // E: Edit title
                    e.preventDefault();
                    setEditingField('header-title');
                    break;
                case 'd': // D: Edit description
                    e.preventDefault();
                    setEditingField('description');
                    break;
                case 'u': // U: Edit due date
                    e.preventDefault();
                    setEditingField('due_date');
                    break;
                case 'p': // P: Edit priority
                    e.preventDefault();
                    setEditingField('priority');
                    break;
                case 'Delete':
                case 'Backspace':
                    if (e.metaKey) { // Cmd+Delete: Delete task
                        e.preventDefault();
                        handleDelete();
                    }
                    break;
            }
        };

        const handleClickOutside = (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen, onClose, editingField, availableLabels, formData.labels]);

    const handleSave = async () => {
        if (!task || !user) return;

        setLoading(true);
        try {
            const updates = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                due_date: formData.due_date || null,
                priority: formData.priority,
                labels: formData.labels,
                checklist: checklist,
                checklist_completed: checklist.filter(item => item.completed).length,
                checklist_total: checklist.length
            };

            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', task.id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            onUpdate(data);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldSave = async (field, value) => {
        if (!task || !user) return;

        try {
            const updates = {
                [field]: value
            };

            // Special handling for checklist updates
            if (field === 'checklist') {
                updates.checklist_completed = value.filter(item => item.completed).length;
                updates.checklist_total = value.length;
            }

            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', task.id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            onUpdate(data);
        } catch (error) {
            console.error('Error updating field:', error);
        }
    };

    const handleDelete = async () => {
        if (!task || !confirm('Are you sure you want to delete this task?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)
                .eq('user_id', user.id);

            if (error) throw error;

            onDelete(task.id);
            onClose();
        } catch (error) {
            console.error('Error deleting task:', error);
        } finally {
            setLoading(false);
        }
    };

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        
        setChecklist(prev => [...prev, {
            id: Date.now(),
            text: newChecklistItem.trim(),
            completed: false
        }]);
        setNewChecklistItem('');
    };

    const toggleChecklistItem = (id) => {
        setChecklist(prev => prev.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const removeChecklistItem = (id) => {
        setChecklist(prev => prev.filter(item => item.id !== id));
    };

    const addLabel = (labelText) => {
        if (!labelText.trim() || formData.labels.includes(labelText.trim())) return;
        setFormData(prev => ({
            ...prev,
            labels: [...prev.labels, labelText.trim()]
        }));
    };


    const removeLabel = (labelToRemove) => {
        setFormData(prev => ({
            ...prev,
            labels: prev.labels.filter(label => label !== labelToRemove)
        }));
    };

    const toggleLabel = (labelId) => {
        const isLabelSelected = formData.labels.includes(labelId);
        const newLabels = isLabelSelected
            ? formData.labels.filter(id => id !== labelId)
            : [...formData.labels, labelId];

        setFormData(prev => ({
            ...prev,
            labels: newLabels
        }));
        handleFieldSave('labels', newLabels);
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
        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays <= 7) return `${diffDays} days`;
        
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    if (!isOpen || !task) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 flex-grow">
                        {editingField === 'header-title' ? (
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                onBlur={() => {
                                    setEditingField(null);
                                    handleFieldSave('title', formData.title.trim());
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setEditingField(null);
                                        handleFieldSave('title', formData.title.trim());
                                    }
                                    if (e.key === 'Escape') {
                                        setFormData(prev => ({ ...prev, title: task.title }));
                                        setEditingField(null);
                                    }
                                }}
                                autoFocus
                                className="text-xl font-semibold bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 outline-none text-gray-900 dark:text-gray-100 flex-grow"
                            />
                        ) : (
                            <h2 
                                className="text-xl font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2 -my-1 transition-colors flex-grow"
                                onClick={() => setEditingField('header-title')}
                            >
                                {task.title || 'Untitled Task'}
                            </h2>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">

                    {/* Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        {editingField === 'description' ? (
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                onBlur={() => {
                                    setEditingField(null);
                                    handleFieldSave('description', formData.description.trim());
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        setEditingField(null);
                                        handleFieldSave('description', formData.description.trim());
                                    }
                                    if (e.key === 'Escape') {
                                        setFormData(prev => ({ ...prev, description: task.description || '' }));
                                        setEditingField(null);
                                    }
                                }}
                                autoFocus
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Add a description..."
                            />
                        ) : (
                            <p 
                                className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[24px]"
                                onClick={() => setEditingField('description')}
                            >
                                {task.description || 'Click to add description...'}
                            </p>
                        )}
                    </div>

                    {/* Due Date and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Due Date
                            </label>
                            {editingField === 'due_date' ? (
                                <DatePicker
                                    value={formData.due_date}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, due_date: value }));
                                        setEditingField(null);
                                        handleFieldSave('due_date', value || null);
                                    }}
                                    placeholder="Select due date"
                                />
                            ) : (
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                                    onClick={() => setEditingField('due_date')}
                                >
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {task.due_date ? formatDueDate(task.due_date) : 'Click to set due date'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Priority
                            </label>
                            {editingField === 'priority' ? (
                                <select
                                    value={formData.priority}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, priority: e.target.value }));
                                        setEditingField(null);
                                        handleFieldSave('priority', e.target.value);
                                    }}
                                    onBlur={() => setEditingField(null)}
                                    autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                >
                                    <option value="none">No Priority</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            ) : (
                                <div 
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                                    onClick={() => setEditingField('priority')}
                                >
                                    <div className={`w-3 h-3 rounded-full ${
                                        task.priority === 'high' ? 'bg-red-500' :
                                        task.priority === 'medium' ? 'bg-yellow-500' :
                                        task.priority === 'low' ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                                        {task.priority === 'none' ? 'Click to set priority' : task.priority}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Labels
                        </label>
                        <LabelSelector
                            selectedLabels={formData.labels}
                            onLabelsChange={(newLabels) => {
                                setFormData(prev => ({ ...prev, labels: newLabels }));
                                handleFieldSave('labels', newLabels);
                            }}
                            onManageLabels={() => setIsLabelManagementOpen(true)}
                            showKeyboardShortcuts={true}
                            availableLabels={availableLabels}
                        />
                        {availableLabels.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Press 1-9 to quickly toggle labels
                            </p>
                        )}
                    </div>

                    {/* Checklist */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Checklist ({checklist.filter(item => item.completed).length}/{checklist.length})
                        </label>
                        
                        {checklist.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 mb-2">
                                <button
                                    onClick={() => {
                                        const newChecklist = checklist.map(checkItem => 
                                            checkItem.id === item.id ? { ...checkItem, completed: !checkItem.completed } : checkItem
                                        );
                                        setChecklist(newChecklist);
                                        handleFieldSave('checklist', newChecklist);
                                    }}
                                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        item.completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                                    }`}
                                >
                                    {item.completed && <Check className="w-3 h-3" />}
                                </button>
                                <span className={`flex-grow ${item.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {item.text}
                                </span>
                                <button
                                    onClick={() => {
                                        const newChecklist = checklist.filter(checkItem => checkItem.id !== item.id);
                                        setChecklist(newChecklist);
                                        handleFieldSave('checklist', newChecklist);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <div className="flex gap-2 mt-3">
                            <input
                                type="text"
                                value={newChecklistItem}
                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newChecklistItem.trim()) {
                                            const newItem = {
                                                id: Date.now(),
                                                text: newChecklistItem.trim(),
                                                completed: false
                                            };
                                            const newChecklist = [...checklist, newItem];
                                            setChecklist(newChecklist);
                                            setNewChecklistItem('');
                                            handleFieldSave('checklist', newChecklist);
                                        }
                                    }
                                }}
                                placeholder="Add checklist item..."
                                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                            />
                            <button
                                onClick={() => {
                                    if (newChecklistItem.trim()) {
                                        const newItem = {
                                            id: Date.now(),
                                            text: newChecklistItem.trim(),
                                            completed: false
                                        };
                                        const newChecklist = [...checklist, newItem];
                                        setChecklist(newChecklist);
                                        setNewChecklistItem('');
                                        handleFieldSave('checklist', newChecklist);
                                    }
                                }}
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created {new Date(task.created_at).toLocaleDateString()}
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Task
                    </button>
                </div>
            </div>

            {/* Label Management Modal */}
            <LabelManagementModal
                isOpen={isLabelManagementOpen}
                onClose={() => setIsLabelManagementOpen(false)}
                onLabelsUpdate={fetchLabels}
            />
        </div>
    );
};

export default TaskDetailModal;