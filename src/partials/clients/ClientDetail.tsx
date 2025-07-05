import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext'; // Add this import
import { Mail, Phone, Briefcase, Globe, Edit2, Save, X, Trash2, Link as LinkIcon, User, Key, Copy, Check } from 'lucide-react';

import Sidebar from '../Sidebar';
import Header from '../Header';
import ToggleSwitch from '../../components/ToggleSwitch';
import EditClientForm from './EditClientForm';
import ClientDetailUI from './ClientDetailUI';

function ClientDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [originalClient, setOriginalClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);
  
  // Use the useAuth hook instead of manual user state
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchClient();
    }
  }, [id, user]); // Add user as dependency

  // Remove the checkUser function since we're using useAuth

  async function fetchClient() {
    if (!user) {
      setError('You must be logged in to view client details.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)  // Ensure user can only access their own clients
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - client doesn't exist or doesn't belong to user
          setError('Client not found or you do not have permission to view it.');
        } else {
          throw error;
        }
        return;
      }
      
      const clientData = {
        ...data,
        github_repo: data.github_repo || '',
        web_host: parseJsonField(data.web_host),
        registrar: parseJsonField(data.registrar)
      };
      
      setClient(clientData);
      setOriginalClient(clientData);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching client:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateClient() {
    if (!user) {
      setError('You must be logged in to update a client.');
      return;
    }

    try {
      setLoading(true);
      
      // Format web_host and registrar as arrays with one object
      const web_host_array = client.web_host ? [client.web_host] : [];
      const registrar_array = client.registrar ? [client.registrar] : [];

      // Create a clean copy of the client data for update
      const updatedClient = {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        website: client.website,
        status: client.status,
        github_repo: client.github_repo || null,
        web_host: web_host_array,
        registrar: registrar_array,
        additional_info: client.additional_info || [],
        user_id: user.id  // Ensure user_id is maintained
      };

      const { data, error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', id)
        .eq('user_id', user.id)  // Double-check user owns this client
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedData = {
          ...data[0],
          web_host: Array.isArray(data[0].web_host) && data[0].web_host.length > 0 
            ? data[0].web_host[0] 
            : {},
          registrar: Array.isArray(data[0].registrar) && data[0].registrar.length > 0 
            ? data[0].registrar[0] 
            : {},
          additional_info: data[0].additional_info || []
        };
        
        setClient(updatedData);
        setOriginalClient(updatedData);
        setIsEditing(false);
        setError(null);
      } else {
        setError('Failed to update client. Please try again.');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setError(`Error updating client: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Simplified parsing function
  function parseJsonField(field) {
    if (!field) return {};
    if (Array.isArray(field)) return field[0] || {};
    if (typeof field === 'object') return field;
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn('Error parsing JSON field:', error);
      return {};
    }
  }

  async function deleteClient() {
    if (!user) {
      setError('You must be logged in to delete a client.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);  // Ensure user can only delete their own clients

        if (error) throw error;

        navigate('/clients');
      } catch (error) {
        console.error('Error deleting client:', error);
        setError(`Error deleting client: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  }

  const handleInputChange = (e, fieldName) => {
    const { value } = e.target;
    const keys = fieldName.split('.');
    
    if (keys.length === 1) {
      setClient(prev => ({ ...prev, [fieldName]: value }));
    } else {
      setClient(prev => {
        const newClient = { ...prev };
        let current = newClient;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newClient;
      });
    }
  };

  const handleJsonFieldChange = (fieldName, subField, value) => {
    setClient(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [subField]: value
      }
    }));
  };

  const handleStatusChange = (isActive) => {
    const newStatus = isActive ? 'active' : 'inactive';
    setClient(prev => ({ ...prev, status: newStatus }));
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSave = async () => {
    await updateClient();
  };

  const handleCancel = () => {
    setClient(originalClient);
    setIsEditing(false);
    setError(null);
  };

  // Show loading state while checking authentication
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
                  Please sign in to view client details.
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
              <div className="text-center">Loading client details...</div>
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
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Link 
                  to="/clients"
                  className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  ← Back to Clients
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Client Not Found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The client you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Link 
                  to="/clients"
                  className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  ← Back to Clients
                </Link>
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
            
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 flex justify-end">
                <Link to="/clients" className="text-indigo-500 hover:text-indigo-600 flex items-center transition-colors">
                  ← Back to Clients
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {client?.company ? client.company.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client?.company || 'Unnamed Company'}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client?.name || 'No contact name'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={deleteClient}
                        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 border border-gray-100 dark:border-gray-700">
              {isEditing ? (
                <EditClientForm
                  client={client}
                  handleInputChange={handleInputChange}
                  handleJsonFieldChange={handleJsonFieldChange}
                  handleStatusChange={handleStatusChange}
                />
              ) : (
                <ClientDetailUI
                  client={client}
                  handleStatusChange={handleStatusChange}
                  copyToClipboard={copyToClipboard}
                  copiedField={copiedField}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ClientDetail;