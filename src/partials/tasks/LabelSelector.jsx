import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag, Settings } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const LabelSelector = ({ selectedLabels = [], onLabelsChange, onManageLabels }) => {
    const [availableLabels, setAvailableLabels] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchLabels();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchLabels = async () => {
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

    const toggleLabel = (labelId) => {
        const isSelected = selectedLabels.includes(labelId);
        if (isSelected) {
            onLabelsChange(selectedLabels.filter(id => id !== labelId));
        } else {
            onLabelsChange([...selectedLabels, labelId]);
        }
    };

    const removeLabel = (labelId) => {
        onLabelsChange(selectedLabels.filter(id => id !== labelId));
    };

    const filteredLabels = availableLabels.filter(label =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSelectedLabelObjects = () => {
        return availableLabels.filter(label => selectedLabels.includes(label.id));
    };

    const getUnselectedLabels = () => {
        return filteredLabels.filter(label => !selectedLabels.includes(label.id));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected Labels Display */}
            <div className="flex flex-wrap gap-2 mb-2">
                {getSelectedLabelObjects().map((label) => (
                    <span
                        key={label.id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-white text-xs rounded-full shadow-sm"
                        style={{ backgroundColor: label.color }}
                    >
                        {label.name}
                        <button
                            onClick={() => removeLabel(label.id)}
                            className="hover:bg-black/20 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            {/* Add Label Button */}
            <div className="flex gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <Tag className="w-4 h-4" />
                    Add Label
                </button>

                {onManageLabels && (
                    <button
                        onClick={onManageLabels}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        title="Manage Labels"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search labels..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                            autoFocus
                        />
                    </div>

                    {/* Labels List */}
                    <div className="max-h-48 overflow-y-auto">
                        {getUnselectedLabels().length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                {availableLabels.length === 0 ? (
                                    <>
                                        <div className="mb-2">No labels available</div>
                                        {onManageLabels && (
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    onManageLabels();
                                                }}
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                                            >
                                                Create your first label
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    'No labels match your search'
                                )}
                            </div>
                        ) : (
                            <div className="py-1">
                                {getUnselectedLabels().map((label) => (
                                    <button
                                        key={label.id}
                                        onClick={() => {
                                            toggleLabel(label.id);
                                            setSearchTerm('');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {label.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Manage Labels Link */}
                    {onManageLabels && availableLabels.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onManageLabels();
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Manage Labels
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LabelSelector;