import React from 'react';
import { Star, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function NotesGrid({ notes, onNoteClick, onDeleteNote, onToggleFavorite, categories }) {
  // Helper function to get category name and color
  const getCategoryInfo = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category || null;
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
    return text.substring(0, 150); // Limit preview length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => {
        const category = getCategoryInfo(note.category_id);
        const preview = getPlainText(note.content);

        return (
          <div
            key={note.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onNoteClick(note.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate mb-1">
                  {note.title || 'Untitled'}
                </h3>
                {category && (
                  <div className="flex items-center gap-1 text-sm">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      {category.icon} {category.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(note.id, note.is_favorite);
                  }}
                  className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
              {preview || 'No content'}
            </p>

            {/* Footer */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(note.last_edited_at || note.created_at), 'MMM d, yyyy')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NotesGrid;
