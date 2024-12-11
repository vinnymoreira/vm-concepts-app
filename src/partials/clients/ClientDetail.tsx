import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
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
  const [user, setUser] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    checkUser();
    fetchClient();
  }, [id]);

  async function checkUser() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting auth session:', error);
      setUser(null);
    } else if (data && data.session) {
      setUser(data.session.user);
    } else {
      setUser(null);
    }
  }

async function fetchClient() {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const clientData = {
      ...data,
      github_repo: data.github_repo || '',
      web_host: parseJsonField(data.web_host),
      registrar: parseJsonField(data.registrar)
    };
    
    // console.log('Fetched client data:', clientData);
    
    setClient(clientData);
    setOriginalClient(clientData);
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
      additional_info: client.additional_info || []
    };

    // console.log('Sending update with data:', updatedClient);

    const { data, error } = await supabase
      .from('clients')
      .update(updatedClient)
      .eq('id', id)
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
          .eq('id', id);

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
    
    setClient(prevClient => {
      let updatedClient = { ...prevClient };
      if (keys.length === 1) {
        updatedClient[keys[0]] = value;
      } else if (keys.length === 2) {
        updatedClient[keys[0]] = {
          ...updatedClient[keys[0]],
          [keys[1]]: value
        };
      }
      return updatedClient;
    });
  };

  const handleStatusChange = async (checked) => {
    const newStatus = checked ? 'active' : 'inactive';
    setClient(prev => ({ ...prev, status: newStatus }));
    
    if (!isEditing) {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating client status:', error);
        setError(`Error updating client status: ${error.message}`);
        setClient(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleCancel = () => {
    setClient(originalClient);
    setIsEditing(false);
    setError(null);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const renderField = (icon, value, type = "text", link = null, canCopy = false, fieldName = '') => (
    <div className="flex items-center mb-4">
      <div className="flex-shrink-0 mr-3">
        {icon}
      </div>
      <div className="flex-grow flex items-center">
        {isEditing ? (
          <input
            type={type}
            name={fieldName}
            value={value || ''}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none py-1 transition duration-150 ease-in-out"
          />
        ) : link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {value || 'N/A'}
          </a>
        ) : (
          <p className="text-gray-900 dark:text-gray-100">
            {value || 'N/A'}
          </p>
        )}
        {canCopy && !isEditing && (
          <button
            onClick={() => copyToClipboard(value, fieldName)}
            className="ml-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Copy to clipboard"
          >
            {copiedField === fieldName ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  const renderCredentials = (urlIcon, url, usernameIcon, username, passwordIcon, password, fieldPrefix) => (
    <div className="mb-4">
      {renderField(urlIcon, url, "text", url, false, `${fieldPrefix}_url`)}
      <div className="grid grid-cols-2 gap-4 mt-2">
        {renderField(usernameIcon, username, "text", null, true, `${fieldPrefix}_username`)}
        {renderField(passwordIcon, password, "password", null, true, `${fieldPrefix}_password`)}
      </div>
    </div>
  );

  if (loading && !client) return <div className="flex items-center h-screen justify-center p-4">Loading board...</div>;
  if (error && !client) return <div>Error: {error}</div>;
  if (!client) return <div>No client found</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <Link to="/clients" className="btn bg-white hover:bg-gray-200">
                &larr; Back to Clients
              </Link>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={updateClient}
                      className="btn bg-green-500 hover:bg-green-600 text-white flex items-center"
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn bg-indigo-500 hover:bg-indigo-600 text-white flex items-center"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Client
                    </button>
                    <button
                      onClick={deleteClient}
                      className="btn bg-red-400 hover:bg-red-600 text-white flex items-center"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Client
                    </button>
                  </>
                )}
              </div>
            </div>
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              {isEditing ? (
                <EditClientForm
                  client={client}
                  handleInputChange={handleInputChange}
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