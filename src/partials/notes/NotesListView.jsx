import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, Trash2, Calendar, Folder } from 'lucide-react';
import { format } from 'date-fns';

function SortableNoteItem({ note, category, onNoteClick, onDeleteNote, onToggleFavorite }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Helper function to extract plain text from Tiptap JSON content
  const getPlainText = (content) => {
    if (!content || !content.content) return '';

    let text = '';
    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 'text') {
          text += node.text;
        } else if (node.content) {
          traverse(node.content);
        }
      });
    };

    traverse(content.content);
    return text.substring(0, 150);
  };

  const preview = getPlainText(note.content);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
      onClick={() => onNoteClick(note.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {note.title || 'Untitled'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {preview || 'No content'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(note.id, note.is_favorite);
            }}
            className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              note.is_favorite ? 'text-yellow-500' : 'text-gray-400'
            }`}
            title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${note.is_favorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this note?')) {
                onDeleteNote(note.id);
              }
            }}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        {category && (
          <div className="flex items-center gap-1">
            <span>{category.icon && category.icon !== '🚫' && `${category.icon} `}{category.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(note.last_edited_at || note.created_at), 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  );
}

function NotesListView({ notes, categories, onNoteClick, onDeleteNote, onToggleFavorite, onNotesReordered }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group notes by category
  const groupedNotes = React.useMemo(() => {
    const groups = {};

    // Create uncategorized group
    groups['uncategorized'] = {
      category: null,
      notes: []
    };

    // Create groups for each category
    categories.forEach(cat => {
      groups[cat.id] = {
        category: cat,
        notes: []
      };
    });

    // Sort notes into groups
    notes.forEach(note => {
      const categoryId = note.category_id || 'uncategorized';
      if (groups[categoryId]) {
        groups[categoryId].notes.push(note);
      }
    });

    // Sort notes within each group by position, then by last_edited_at
    Object.values(groups).forEach(group => {
      group.notes.sort((a, b) => {
        // First sort by position if available
        if (a.position !== b.position) {
          return (a.position || 0) - (b.position || 0);
        }
        // Then by last_edited_at
        return new Date(b.last_edited_at || b.created_at) - new Date(a.last_edited_at || a.created_at);
      });
    });

    // Filter out empty groups
    return Object.entries(groups)
      .filter(([_, group]) => group.notes.length > 0)
      .map(([id, group]) => ({ id, ...group }));
  }, [notes, categories]);

  const handleDragEnd = (event, categoryId) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const group = groupedNotes.find(g => g.id === categoryId);
      if (!group) return;

      const oldIndex = group.notes.findIndex((note) => note.id === active.id);
      const newIndex = group.notes.findIndex((note) => note.id === over.id);

      const newNotes = arrayMove(group.notes, oldIndex, newIndex);

      // Call the reorder callback with updated notes
      onNotesReordered(newNotes, categoryId);
    }
  };

  // Helper function to get category info
  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || null;
  };

  if (groupedNotes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {groupedNotes.map((group) => (
        <div key={group.id}>
          {/* Category header */}
          <div className="flex items-center gap-2 mb-3">
            {group.category ? (
              <>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {group.category.icon && group.category.icon !== '⭕' && `${group.category.icon} `}{group.category.name}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({group.notes.length})
                </span>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Uncategorized
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({group.notes.length})
                </span>
              </>
            )}
          </div>

          {/* Notes list with drag-and-drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, group.id)}
          >
            <SortableContext
              items={group.notes.map(note => note.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {group.notes.map((note) => (
                  <SortableNoteItem
                    key={note.id}
                    note={note}
                    category={getCategoryInfo(note.category_id)}
                    onNoteClick={onNoteClick}
                    onDeleteNote={onDeleteNote}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}
    </div>
  );
}

export default NotesListView;
