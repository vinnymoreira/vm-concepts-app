import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

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

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company');
      
      if (error) {
        console.error('Error fetching clients:', error);
        setError(error.message);
      } else {
        // console.log('Fetched clients:', data); // Log the fetched data
        setClients(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleAddClient = async (newClient) => {
    try {
      setLoading(true);
      // Format the client data
      const formattedClient = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        company: newClient.company,
        website: newClient.website,
        status: newClient.status,
        additional_info: newClient.additionalInfo // This should match your Supabase column name
      };
  
      const { data, error } = await supabase
        .from('clients')
        .insert([formattedClient]);
  
      if (error) {
        console.error('Error adding client:', error);
        setError(error.message);
      } else {
        fetchClients(); // Refresh the client list
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center h-screen justify-center p-4">Loading board...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Clients</h1>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Add Client</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                />
              ))}
            </div>
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