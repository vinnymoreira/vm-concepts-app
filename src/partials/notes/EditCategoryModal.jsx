import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const PRESET_ICONS = ['🚫', '📁', '📝', '💼', '🎯', '💡', '📚', '🔥', '⭐', '✨', '🚀', '💻', '🎨', '📊', '🎓', '🏠'];

function EditCategoryModal({ isOpen, onClose, onCategoryUpdated, category }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚫');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setIcon(category.icon || '🚫');
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !name.trim() || !category) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('note_categories')
        .update({
          name: name.trim(),
          icon,
        })
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) throw error;

      onCategoryUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Edit Category
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, Personal, Ideas"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Icon */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((presetIcon, index) => (
                <button
                  key={presetIcon}
                  type="button"
                  onClick={() => setIcon(presetIcon)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition-all ${
                    icon === presetIcon
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  title={index === 0 ? 'None' : presetIcon}
                >
                  {index === 0 ? (
                    <span className="text-red-500 font-bold text-2xl">🚫</span>
                  ) : (
                    presetIcon
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              First option (🚫) = No icon
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCategoryModal;
