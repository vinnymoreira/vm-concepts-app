import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { Plus, FileText, Star, Folder, Search, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotesGrid from '../partials/notes/NotesGrid';
import NotesSidebar from '../partials/notes/NotesSidebar';
import AddCategoryModal from '../partials/notes/AddCategoryModal';
import ImportNotesModal from '../partials/notes/ImportNotesModal';

function Notes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'favorites'

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeNotes = async () => {
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

        await Promise.all([
          fetchNotes(isMounted),
          fetchCategories(isMounted)
        ]);

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing notes:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeNotes();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const fetchNotes = async (isMounted = true) => {
    if (!user) return;

    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('last_edited_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (viewMode === 'favorites') {
        query = query.eq('is_favorite', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (isMounted) {
        setNotes(data || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      if (isMounted) {
        setError(err.message);
      }
    }
  };

  const fetchCategories = async (isMounted = true) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('note_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (isMounted) {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (isMounted) {
        setError(err.message);
      }
    }
  };

  const handleCreateNote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            user_id: user.id,
            title: 'Untitled',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            category_id: selectedCategory,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Navigate to the note editor
      navigate(`/notes/${data.id}`);
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err.message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh notes
      await fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err.message);
    }
  };

  const handleToggleFavorite = async (noteId, currentFavoriteState) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !currentFavoriteState })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh notes
      await fetchNotes();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(err.message);
    }
  };

  const handleCategoryCreated = async () => {
    await fetchCategories();
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setViewMode('all');
  };

  const handleNotesImported = async () => {
    await fetchNotes();
  };

  // Filter notes by search query
  const filteredNotes = notes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      (note.content?.content && JSON.stringify(note.content).toLowerCase().includes(searchLower))
    );
  });

  // Refresh notes when category or view mode changes
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [selectedCategory, viewMode]);

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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Page header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              {/* Left: Title */}
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Notes ✨
                </h1>
              </div>

              {/* Right: Actions */}
              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                {/* Import button */}
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Import</span>
                </button>

                {/* Add note button */}
                <button
                  onClick={handleCreateNote}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>New Note</span>
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-6">
              {/* Notes Sidebar (Categories) */}
              <NotesSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                onAddCategory={() => setIsAddCategoryModalOpen(true)}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCategoriesChange={fetchCategories}
              />

              {/* Main content */}
              <div className="flex-1">
                {/* Search bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Notes grid */}
                <NotesGrid
                  notes={filteredNotes}
                  onNoteClick={(noteId) => navigate(`/notes/${noteId}`)}
                  onDeleteNote={handleDeleteNote}
                  onToggleFavorite={handleToggleFavorite}
                  categories={categories}
                />

                {/* Empty state */}
                {filteredNotes.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      {searchQuery ? 'No notes found' : 'No notes yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {searchQuery
                        ? 'Try adjusting your search'
                        : 'Create your first note to get started'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleCreateNote}
                        className="btn bg-violet-500 hover:bg-violet-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        <span>Create Note</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      <ImportNotesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onNotesImported={handleNotesImported}
        categories={categories}
      />
    </div>
  );
}

export default Notes;
