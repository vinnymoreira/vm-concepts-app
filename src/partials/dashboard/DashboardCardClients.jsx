import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const DashboardCardClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, initialized } = useAuth();

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
          .eq('status', 'active')  // Only fetch active clients
          .limit(5)  // Only show latest 5 clients
          .order('created_at', { ascending: false });
        
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
  }, [user, initialized]); // Proper dependencies

  if (!initialized) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Sign in to view your clients
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="p-4 text-red-500">
          Error loading clients: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Active Clients</h2>
      </header>      
      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 dark:bg-opacity-50">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Company</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Contact</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Status</div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="space-y-2">
                      <p>No active clients yet</p>
                      <Link 
                        to="/clients"
                        className="inline-block text-indigo-500 hover:text-indigo-600 text-sm font-medium"
                      >
                        Add your first client →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id}>
                    <td className="p-2 whitespace-nowrap">
                      <Link 
                        to={`/clients/${client.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {client.company}
                      </Link>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="text-left text-gray-700 dark:text-gray-300">{client.name}</div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardCardClients;