import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, Check, Palette, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const LabelManagementModal = ({ isOpen, onClose, onLabelsUpdate }) => {
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newLabel, setNewLabel] = useState({ name: '', color: '#6366f1' });
    const [editingLabel, setEditingLabel] = useState(null);
    const { user } = useAuth();

    const predefinedColors = [
        '#ef4444', // Red
        '#f59e0b', // Orange
        '#10b981', // Green
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#f97316', // Orange
        '#6366f1', // Indigo
        '#8b5a2b', // Brown
        '#6b7280'  // Gray
    ];

    useEffect(() => {
        if (isOpen && user) {
            fetchLabels();
        }
    }, [isOpen, user]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                // Don't close if user is editing a label
                if (!editingLabel) {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, editingLabel, onClose]);

    const fetchLabels = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('task_labels')
                .select('*')
                .eq('user_id', user.id)
                .order('position', { ascending: true });

            if (error) throw error;
            setLabels(data || []);
        } catch (error) {
            console.error('Error fetching labels:', error);
        } finally {
            setLoading(false);
        }
    };

    const createLabel = async () => {
        if (!newLabel.name.trim()) return;

        try {
            const { data, error } = await supabase
                .from('task_labels')
                .insert([{
                    user_id: user.id,
                    name: newLabel.name.trim(),
                    color: newLabel.color,
                    position: labels.length
                }])
                .select()
                .single();

            if (error) throw error;

            setLabels([...labels, data]);
            setNewLabel({ name: '', color: '#6366f1' });
            onLabelsUpdate?.();
        } catch (error) {
            console.error('Error creating label:', error);
        }
    };

    const updateLabel = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('task_labels')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            setLabels(labels.map(label =>
                label.id === id ? data : label
            ));
            setEditingLabel(null);
            onLabelsUpdate?.();
        } catch (error) {
            console.error('Error updating label:', error);
        }
    };

    const deleteLabel = async (id) => {
        if (!confirm('Are you sure you want to delete this label? It will be removed from all tasks that use it.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('task_labels')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setLabels(labels.filter(label => label.id !== id));
            onLabelsUpdate?.();
        } catch (error) {
            console.error('Error deleting label:', error);
        }
    };

    const createDefaultLabels = async () => {
        try {
            const { error } = await supabase.rpc('create_default_task_labels', {
                target_user_id: user.id
            });

            if (error) throw error;
            fetchLabels();
        } catch (error) {
            console.error('Error creating default labels:', error);
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination } = result;
        if (source.index === destination.index) return;

        // Reorder labels array
        const reorderedLabels = Array.from(labels);
        const [movedLabel] = reorderedLabels.splice(source.index, 1);
        reorderedLabels.splice(destination.index, 0, movedLabel);

        // Update state immediately for smooth UX
        setLabels(reorderedLabels);

        // Update positions in database
        try {
            const updates = reorderedLabels.map((label, index) => ({
                id: label.id,
                position: index
            }));

            // Update all positions
            for (const update of updates) {
                await supabase
                    .from('task_labels')
                    .update({ position: update.position })
                    .eq('id', update.id)
                    .eq('user_id', user.id);
            }

            onLabelsUpdate?.();
        } catch (error) {
            console.error('Error updating label positions:', error);
            // Revert on error
            fetchLabels();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                // Close modal if clicking on the overlay (not the modal content)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Manage Labels
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Add New Label */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Add New Label
                        </h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Label Name
                                </label>
                                <input
                                    type="text"
                                    value={newLabel.name}
                                    onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            createLabel();
                                        }
                                    }}
                                    placeholder="Enter label name..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Color
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={newLabel.color}
                                        onChange={(e) => setNewLabel(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {predefinedColors.slice(0, 6).map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                                                className={`w-6 h-6 rounded-full border-2 ${newLabel.color === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={createLabel}
                                disabled={!newLabel.name.trim()}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Existing Labels */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Your Labels ({labels.length})
                            </h3>
                            {labels.length === 0 && (
                                <button
                                    onClick={createDefaultLabels}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Create Default Labels
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                        ) : labels.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No labels created yet.</p>
                                <p className="text-sm">Create your first label above or use default labels.</p>
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="labels-list">
                                    {(provided) => (
                                        <div
                                            className="space-y-2"
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {labels.map((label, index) => (
                                                <Draggable
                                                    key={label.id}
                                                    draggableId={label.id.toString()}
                                                    index={index}
                                                    isDragDisabled={editingLabel?.id === label.id}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${
                                                                snapshot.isDragging ? 'shadow-lg scale-105' : ''
                                                            }`}
                                                        >
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                            <div className="flex items-center gap-1 min-w-[24px]">
                                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            {editingLabel?.id === label.id ? (
                                                                <>
                                                                    <input
                                                                        type="color"
                                                                        value={editingLabel.color}
                                                                        onChange={(e) => setEditingLabel(prev => ({ ...prev, color: e.target.value }))}
                                                                        className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={editingLabel.name}
                                                                        onChange={(e) => setEditingLabel(prev => ({ ...prev, name: e.target.value }))}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                updateLabel(label.id, editingLabel);
                                                                            } else if (e.key === 'Escape') {
                                                                                setEditingLabel(null);
                                                                            }
                                                                        }}
                                                                        className="flex-grow px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => updateLabel(label.id, editingLabel)}
                                                                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                                                                            title="Save"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingLabel(null)}
                                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                                                            title="Cancel"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div
                                                                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600"
                                                                        style={{ backgroundColor: label.color }}
                                                                    />
                                                                    <span className="flex-grow text-gray-900 dark:text-gray-100 font-medium">
                                                                        {label.name}
                                                                    </span>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => setEditingLabel({ id: label.id, name: label.name, color: label.color })}
                                                                            className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <Edit3 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteLabel(label.id)}
                                                                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Labels help organize and categorize your tasks
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelManagementModal;