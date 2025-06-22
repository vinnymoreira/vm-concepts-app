import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import AddClientModal from '../partials/clients/AddClientModal';

const ClientCard = ({ client }) => (
  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
    <Link to={`/clients/${client.id}`} className="block">
      <div className="flex gap-2">
        <User className="w-12 h-12 text-indigo-500 mb-4" />
        <div>
          <h2 className="text-xl font-semibold mb-0">{client.company}</h2>
          <p className="text-gray-500">{client.name}</p>
        </div>
      </div>
    </Link>
  </div>
);

function Clients() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, initialized } = useAuth(); // ✅ Get initialized from useAuth

  // ✅ FIXED: Proper useEffect with dependencies and cleanup
  useEffect(() => {
    let isMounted = true;

    const fetchClients = async () => {
      if (!user || !initialized) {
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
          .from('clients')
          .select('*')
          .eq('user_id', user.id)  // Only fetch clients for current user
          .order('company');
        
        if (error) throw error;
        
        if (isMounted) {
          setClients(data || []);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClients();

    return () => {
      isMounted = false;
    };
  }, [user, initialized]); // ✅ Proper dependencies

  const handleAddClient = async (newClient) => {
    if (!user) {
      setError('You must be logged in to add clients.');
      return;
    }

    try {
      setLoading(true);
      const formattedClient = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        company: newClient.company,
        website: newClient.website,
        status: newClient.status,
        additional_info: newClient.additionalInfo,
        user_id: user.id
      };
  
      const { data, error } = await supabase
        .from('clients')
        .insert([formattedClient]);
  
      if (error) throw error;
      
      // Refetch clients after adding
      const { data: updatedClients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('company');
      
      if (!fetchError) {
        setClients(updatedClients || []);
      }
      
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding client:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show loading while auth is initializing
  if (!initialized) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Authentication Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to view your clients.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <span className="ml-2">Loading clients...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">My Clients</h1>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Add Client</span>
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                  No clients yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by adding your first client
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>Add Your First Client</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClient={handleAddClient}
      />
    </div>
  );
}

export default Clients;