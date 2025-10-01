import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Folder, Star, FileText, GripVertical, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function SortableCategory({ category, isSelected, onSelect, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group ${
        isSelected
          ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
      onClick={() => onSelect(category.id)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Category info */}
      <Folder className="w-4 h-4 flex-shrink-0" style={{ color: category.color }} />
      <span className="text-sm font-medium flex-1 truncate">
        {category.icon} {category.name}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          title="Edit category"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(category.id);
          }}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          title="Delete category"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function NotesSidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  viewMode,
  onViewModeChange,
  onCategoriesChange
}) {
  const { user } = useAuth();
  const [localCategories, setLocalCategories] = useState(categories);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local categories when prop changes
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = localCategories.findIndex((cat) => cat.id === over.id);

      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newCategories);

      // Update positions in database
      try {
        const updates = newCategories.map((cat, index) => ({
          id: cat.id,
          position: index,
        }));

        for (const update of updates) {
          await supabase
            .from('note_categories')
            .update({ position: update.position })
            .eq('id', update.id)
            .eq('user_id', user.id);
        }

        onCategoriesChange();
      } catch (err) {
        console.error('Error updating category positions:', err);
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure? Notes in this category will be uncategorized.')) return;

    try {
      const { error } = await supabase
        .from('note_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (selectedCategory === categoryId) {
        onCategorySelect(null);
      }

      onCategoriesChange();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {/* Views */}
        <div className="mb-6">
          <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-3">
            Views
          </h3>

          <button
            onClick={() => {
              onViewModeChange('all');
              onCategorySelect(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-1 ${
              viewMode === 'all' && !selectedCategory
                ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>All Notes</span>
          </button>

          <button
            onClick={() => {
              onViewModeChange('favorites');
              onCategorySelect(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'favorites'
                ? 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Favorites</span>
          </button>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
              Categories
            </h3>
            <button
              onClick={onAddCategory}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              title="Add category"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {localCategories.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No categories yet
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localCategories.map(cat => cat.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {localCategories.map((category) => (
                    <SortableCategory
                      key={category.id}
                      category={category}
                      isSelected={selectedCategory === category.id}
                      onSelect={onCategorySelect}
                      onEdit={onEditCategory}
                      onDelete={handleDeleteCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesSidebar;
