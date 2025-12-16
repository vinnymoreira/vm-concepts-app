import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ManageCategoriesModal({ isOpen, onClose, onCategoriesUpdated, categories }) {
  const { user } = useAuth();
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'expense' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Group categories by type
  const categoriesByType = useMemo(() => {
    return {
      revenue: categories.filter(cat => cat.type === 'revenue'),
      expense: categories.filter(cat => cat.type === 'expense'),
    };
  }, [categories]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setIsAddMode(false);
    setEditingId(null);
    setFormData({ name: '', type: 'expense' });
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return false;
    }

    // Check for duplicates within the same type
    const duplicate = categories.find(
      cat =>
        cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        cat.type === formData.type &&
        cat.id !== editingId
    );

    if (duplicate) {
      setError(`A ${formData.type} category with this name already exists`);
      return false;
    }

    return true;
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('bookkeeping_categories')
        .insert([{
          user_id: user.id,
          name: formData.name.trim(),
          type: formData.type,
        }]);

      if (insertError) throw insertError;

      // Reset form
      setFormData({ name: '', type: 'expense' });
      setIsAddMode(false);

      // Refresh categories
      onCategoriesUpdated();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, type: category.type });
    setIsAddMode(false);
    setError(null);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('bookkeeping_categories')
        .update({ name: formData.name.trim() })
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Reset form
      setFormData({ name: '', type: 'expense' });
      setEditingId(null);

      // Refresh categories
      onCategoriesUpdated();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (deleteConfirmId !== categoryId) {
      setDeleteConfirmId(categoryId);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('bookkeeping_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setDeleteConfirmId(null);

      // Refresh categories
      onCategoriesUpdated();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'expense' });
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Manage Categories
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {(isAddMode || editingId) && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={editingId ? handleUpdateCategory : handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setError(null);
                    }}
                    placeholder="e.g., Marketing, Subscriptions"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="revenue"
                          checked={formData.type === 'revenue'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Revenue</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="expense"
                          checked={formData.type === 'expense'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Expense</span>
                      </label>
                    </div>
                  </div>
                )}

                {editingId && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Type: <span className="font-medium capitalize">{formData.type}</span> (cannot be changed)
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={editingId ? handleCancelEdit : () => setIsAddMode(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.name.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg shadow-lg"
                  >
                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Category Button */}
          {!isAddMode && !editingId && (
            <button
              onClick={() => {
                setIsAddMode(true);
                setError(null);
              }}
              className="mb-6 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700"
            >
              <Plus className="w-5 h-5" />
              Add New Category
            </button>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="text-green-500">Revenue</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({categoriesByType.revenue.length})
                </span>
              </h3>
              <div className="space-y-2">
                {categoriesByType.revenue.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No revenue categories yet
                  </div>
                ) : (
                  categoriesByType.revenue.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className={`p-1.5 ${
                            deleteConfirmId === category.id
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                          title={deleteConfirmId === category.id ? 'Click again to confirm' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expense Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="text-red-500">Expense</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({categoriesByType.expense.length})
                </span>
              </h3>
              <div className="space-y-2">
                {categoriesByType.expense.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No expense categories yet
                  </div>
                ) : (
                  categoriesByType.expense.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className={`p-1.5 ${
                            deleteConfirmId === category.id
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                          }`}
                          title={deleteConfirmId === category.id ? 'Click again to confirm' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageCategoriesModal;
