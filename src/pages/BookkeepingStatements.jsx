import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import UploadStatementModal from '../partials/bookkeeping/UploadStatementModal';

function BookkeepingStatements() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statements, setStatements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { user, initialized } = useAuth();

  const fetchStatements = async () => {
    if (!user || !initialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('bookkeeping_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Fetch statements
      const { data: statementsData, error: statementsError } = await supabase
        .from('bookkeeping_statements')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (statementsError) throw statementsError;

      setCategories(categoriesData || []);
      setStatements(statementsData || []);
    } catch (err) {
      console.error('Error fetching statements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [user, initialized]);

  const handleDeleteStatement = async (statementId, fileUrl) => {
    if (!window.confirm('Are you sure you want to delete this statement? This will not delete associated transactions.')) {
      return;
    }

    try {
      // Delete the file from storage
      if (fileUrl) {
        // Extract the file path from the URL if it's a full URL
        let filePath = fileUrl;
        if (fileUrl.includes('supabase.co')) {
          const urlParts = fileUrl.split('/storage/v1/object/public/bookkeeping-statements/');
          if (urlParts.length > 1) {
            filePath = urlParts[1];
          }
        }

        await supabase.storage
          .from('bookkeeping-statements')
          .remove([filePath]);
      }

      // Delete the database record
      const { error } = await supabase
        .from('bookkeeping_statements')
        .delete()
        .eq('id', statementId);

      if (error) throw error;

      setStatements(prev => prev.filter(s => s.id !== statementId));
    } catch (err) {
      console.error('Error deleting statement:', err);
      alert('Failed to delete statement: ' + err.message);
    }
  };

  const handleViewStatement = async (fileUrl) => {
    try {
      // Extract the file path from the URL if it's a full URL
      let filePath = fileUrl;
      if (fileUrl.includes('supabase.co')) {
        // If it's a full URL, extract the path after the bucket name
        const urlParts = fileUrl.split('/storage/v1/object/public/bookkeeping-statements/');
        if (urlParts.length > 1) {
          filePath = urlParts[1];
        }
      }

      const { data, error } = await supabase.storage
        .from('bookkeeping-statements')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      // Open in new tab to view
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error viewing statement:', err);
      alert('Failed to view statement: ' + err.message);
    }
  };

  const handleDownloadStatement = async (fileUrl, fileName) => {
    try {
      // Extract the file path from the URL if it's a full URL
      let filePath = fileUrl;
      if (fileUrl.includes('supabase.co')) {
        const urlParts = fileUrl.split('/storage/v1/object/public/bookkeeping-statements/');
        if (urlParts.length > 1) {
          filePath = urlParts[1];
        }
      }

      const { data, error } = await supabase.storage
        .from('bookkeeping-statements')
        .createSignedUrl(filePath, 60); // 1 minute expiry for download

      if (error) throw error;

      // Open in new tab to download
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('Error downloading statement:', err);
      alert('Failed to download statement: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status] || badges.processing}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Page Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                  Statement Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload and manage PDF bank and credit card statements
                </p>
              </div>

              <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Statement</span>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : statements.length === 0 ? (
              // Empty State
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  No statements uploaded yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upload your first PDF statement to automatically extract transactions
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Statement</span>
                </button>
              </div>
            ) : (
              // Statements Table
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            File Name
                          </span>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            Upload Date
                          </span>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            Status
                          </span>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            Transactions
                          </span>
                        </th>
                        <th className="px-6 py-3 text-right">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            Actions
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {statements.map((statement) => (
                        <tr key={statement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-indigo-500" />
                              <button
                                onClick={() => handleViewStatement(statement.file_url)}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline text-left"
                              >
                                {statement.file_name}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(statement.upload_date)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(statement.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {statement.transactions_extracted || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewStatement(statement.file_url)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="View statement"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadStatement(statement.file_url, statement.file_name)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download statement"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStatement(statement.id, statement.file_url)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Delete statement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Statement Modal */}
      <UploadStatementModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportComplete={fetchStatements}
        categories={categories}
      />
    </div>
  );
}

export default BookkeepingStatements;
