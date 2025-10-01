import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { ArrowLeft, Star, Trash2, Folder, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import TiptapEditor from '../partials/notes/TiptapEditor';
import debounce from '../utils/debounce';

function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Fetch note data
  useEffect(() => {
    let isMounted = true;

    const fetchNote = async () => {
      if (authLoading) return;

      if (!user) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Note not found');
        }

        if (isMounted) {
          setNote(data);
          setTitle(data.title || '');
          setContent(data.content || { type: 'doc', content: [{ type: 'paragraph' }] });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      isMounted = false;
    };
  }, [id, user, authLoading]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('note_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });

        if (error) throw error;

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, [user]);

  // Auto-save function (debounced)
  const saveNote = useCallback(
    debounce(async (noteId, updatedTitle, updatedContent) => {
      if (!user) return;

      try {
        setSaving(true);

        const { error } = await supabase
          .from('notes')
          .update({
            title: updatedTitle,
            content: updatedContent,
            last_edited_at: new Date().toISOString(),
          })
          .eq('id', noteId)
          .eq('user_id', user.id);

        if (error) throw error;

        setLastSaved(new Date());
        setSaving(false);
      } catch (err) {
        console.error('Error saving note:', err);
        setError('Failed to save note');
        setSaving(false);
      }
    }, 2000), // Auto-save after 2 seconds of inactivity
    [user]
  );

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveNote(id, newTitle, content);
  };

  // Handle content change
  const handleContentChange = (newContent) => {
    setContent(newContent);
    saveNote(id, title, newContent);
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!user || !note) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNote({ ...note, is_favorite: !note.is_favorite });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    }
  };

  // Update category
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value || null;

    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ category_id: categoryId })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNote({ ...note, category_id: categoryId });
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="text-center">Loading...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={() => navigate('/notes')}
                  className="mt-4 btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Back to Notes
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              {/* Left: Back button */}
              <button
                onClick={() => navigate('/notes')}
                className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Back</span>
              </button>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Saving indicator */}
                {saving && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Saving...</span>
                )}
                {lastSaved && !saving && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}

                {/* Category selector */}
                <select
                  value={note?.category_id || ''}
                  onChange={handleCategoryChange}
                  className="form-select text-sm"
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>

                {/* Favorite button */}
                <button
                  onClick={handleToggleFavorite}
                  className={`btn border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 ${
                    note?.is_favorite
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Star className={`w-4 h-4 ${note?.is_favorite ? 'fill-current' : ''}`} />
                </button>

                {/* Delete button */}
                <button
                  onClick={handleDeleteNote}
                  className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-red-300 dark:hover:border-red-600 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title input */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled"
              className="w-full text-4xl font-bold mb-2 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              style={{ outline: 'none' }}
            />

            {/* Note metadata */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(note?.created_at), 'MMM d, yyyy')}</span>
              </div>
              {note?.last_edited_at && note.last_edited_at !== note.created_at && (
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>Last edited {format(new Date(note.last_edited_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>

            {/* Editor */}
            {content && (
              <TiptapEditor
                content={content}
                onUpdate={handleContentChange}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default NoteEditor;
