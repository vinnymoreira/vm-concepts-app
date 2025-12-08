import React, { useState, useEffect } from 'react';
import { FileImage, Trash2, Eye, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function BookkeepingReceipts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const { user, initialized } = useAuth();

  const fetchReceipts = async () => {
    if (!user || !initialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all transactions that have receipts
      const { data, error: receiptsError } = await supabase
        .from('bookkeeping_transactions')
        .select('*')
        .eq('user_id', user.id)
        .not('receipt_url', 'is', null)
        .order('transaction_date', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Generate signed URLs for each receipt
      const receiptsWithUrls = await Promise.all(
        (data || []).map(async (transaction) => {
          try {
            const { data: signedUrlData, error: urlError } = await supabase.storage
              .from('bookkeeping-statements')
              .createSignedUrl(transaction.receipt_url, 3600); // 1 hour expiry

            if (urlError) throw urlError;

            return {
              ...transaction,
              signedUrl: signedUrlData.signedUrl
            };
          } catch (err) {
            console.error('Error getting signed URL for receipt:', err);
            return {
              ...transaction,
              signedUrl: null
            };
          }
        })
      );

      setReceipts(receiptsWithUrls);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [user, initialized]);

  const handleDeleteReceipt = async (transaction) => {
    if (!window.confirm(`Are you sure you want to remove the receipt from this transaction? The transaction will remain.`)) {
      return;
    }

    try {
      // Delete the file from storage
      await supabase.storage
        .from('bookkeeping-statements')
        .remove([transaction.receipt_url]);

      // Update the transaction to remove receipt_url
      const { error } = await supabase
        .from('bookkeeping_transactions')
        .update({ receipt_url: null })
        .eq('id', transaction.id);

      if (error) throw error;

      // Remove from local state
      setReceipts(prev => prev.filter(r => r.id !== transaction.id));
      if (selectedReceipt?.id === transaction.id) {
        setSelectedReceipt(null);
      }
    } catch (err) {
      console.error('Error deleting receipt:', err);
      alert('Failed to delete receipt: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
                  Receipt Gallery
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and manage all uploaded receipt images
                </p>
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
            ) : receipts.length === 0 ? (
              // Empty State
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  No receipts uploaded yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upload receipts when adding or editing transactions to keep track of your documentation
                </p>
              </div>
            ) : (
              // Receipts Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Receipt Image */}
                    <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                      {receipt.signedUrl ? (
                        <img
                          src={receipt.signedUrl}
                          alt={`Receipt for ${receipt.merchant}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedReceipt(receipt)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-12 h-12 text-gray-400" />
                        </div>
                      )}

                      {/* Overlay Actions */}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedReceipt(receipt)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          title="View full image"
                        >
                          <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDeleteReceipt(receipt)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete receipt"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>

                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          receipt.type === 'revenue'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {receipt.type === 'revenue' ? 'Revenue' : 'Expense'}
                        </span>
                      </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate" title={receipt.merchant}>
                        {receipt.merchant}
                      </h3>

                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatAmount(receipt.amount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(receipt.transaction_date)}</span>
                        </div>

                        {receipt.category && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {receipt.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {receipt.description && (
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title={receipt.description}>
                          {receipt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Full Image Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedReceipt.merchant}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(selectedReceipt.transaction_date)} • {formatAmount(selectedReceipt.amount)}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Image */}
            <div className="overflow-auto max-h-[calc(90vh-8rem)]">
              {selectedReceipt.signedUrl ? (
                <img
                  src={selectedReceipt.signedUrl}
                  alt={`Receipt for ${selectedReceipt.merchant}`}
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <FileImage className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReceipt.category && (
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    {selectedReceipt.category}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(selectedReceipt.signedUrl, '_blank')}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={() => handleDeleteReceipt(selectedReceipt)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookkeepingReceipts;
