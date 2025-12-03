import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { Plus, Calendar, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ExpandableSearchBar from '../components/ExpandableSearchBar';
import TimelineView from '../partials/timeline/TimelineView';
import AddEventModal from '../partials/timeline/AddEventModal';

function Timeline() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewMode, setViewMode] = useState('horizontal'); // 'horizontal' or 'vertical'
  const [birthDate, setBirthDate] = useState(null);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const initializeTimeline = async () => {
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
          fetchEvents(isMounted),
          fetchBirthDate(isMounted)
        ]);

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing timeline:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeTimeline();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const fetchEvents = async (isMounted = true) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (error) throw error;

      if (isMounted) {
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      if (isMounted) {
        setError(err.message);
      }
    }
  };

  const fetchBirthDate = async (isMounted = true) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('birth_date')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (isMounted && data?.birth_date) {
        setBirthDate(data.birth_date);
      }
    } catch (err) {
      console.error('Error fetching birth date:', err);
      // Don't set error state for birth date - it's optional
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsAddModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsAddModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!user || !window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message);
    }
  };

  const handleEventSaved = async () => {
    await fetchEvents();
    setIsAddModalOpen(false);
    setEditingEvent(null);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  // Filter events by search query
  const filteredEvents = events.filter(event => {
    const searchLower = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchLower) ||
      (event.category && event.category.toLowerCase().includes(searchLower))
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <span className="ml-2 text-gray-700 dark:text-gray-300">Loading timeline...</span>
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
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left: Title */}
                <div>
                  <h1 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 dark:from-amber-400 dark:via-orange-400 dark:to-rose-400 font-bold mb-2">
                    Life Timeline
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    A journey through moments that matter
                  </p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                  {/* Search bar */}
                  <ExpandableSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search events..."
                  />

                  {/* View toggle */}
                  <button
                    onClick={toggleViewMode}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded-lg hover:border-amber-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
                    title={`Switch to ${viewMode === 'horizontal' ? 'vertical' : 'horizontal'} view`}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {viewMode === 'horizontal' ? 'Horizontal' : 'Vertical'}
                    </span>
                  </button>

                  {/* Add event button */}
                  <button
                    onClick={handleAddEvent}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Event</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Timeline View */}
            <TimelineView
              events={filteredEvents}
              viewMode={viewMode}
              birthDate={birthDate}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
            />

            {/* Empty state */}
            {filteredEvents.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="mb-6 relative inline-block">
                  <Calendar className="w-24 h-24 text-amber-300 dark:text-amber-700 mx-auto" />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 blur-2xl"></div>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-gray-800 dark:text-gray-100 mb-3">
                  {searchQuery ? 'No events found' : 'Your journey begins here'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search to find what you\'re looking for'
                    : 'Start documenting the moments that shape your story'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAddEvent}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Your First Event</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEvent(null);
        }}
        onEventSaved={handleEventSaved}
        event={editingEvent}
      />
    </div>
  );
}

export default Timeline;
