import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Search, Link as LinkIcon, Check } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function UploadReceiptsModal({ isOpen, onClose, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'link', 'complete'
  const [receiptsToLink, setReceiptsToLink] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerms, setSearchTerms] = useState({});
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Format date for display without timezone conversion
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setReceiptsToLink([]);
      setSearchTerms({});
      setStep('upload');
      setError(null);
      setUploading(false);
    }
  }, [isOpen]);

  // Fetch transactions when moving to link step
  useEffect(() => {
    if (step === 'link' && user) {
      fetchTransactions();
    }
  }, [step, user]);

  const fetchTransactions = async () => {
    try {
      // Fetch all transactions without receipts
      const { data, error: txError } = await supabase
        .from('bookkeeping_transactions')
        .select('*')
        .eq('user_id', user.id)
        .is('receipt_url', null)
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    setError(null);

    // Validate files
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isSizeValid = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isImage) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (!isSizeValid) {
        setError(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProceedToLink = () => {
    if (files.length === 0) {
      setError('Please select at least one receipt image');
      return;
    }

    // Create preview URLs for images
    const receiptsData = files.map((file, index) => ({
      id: index,
      file,
      previewUrl: URL.createObjectURL(file),
      linkedTransactionId: null
    }));

    setReceiptsToLink(receiptsData);
    setStep('link');
  };

  const getFilteredTransactions = (receiptIndex) => {
    const searchTerm = searchTerms[receiptIndex] || '';
    if (!searchTerm.trim()) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter(tx =>
      tx.merchant?.toLowerCase().includes(term) ||
      tx.amount?.toString().includes(term) ||
      formatDateDisplay(tx.transaction_date).includes(term) ||
      tx.category?.toLowerCase().includes(term)
    );
  };

  const linkReceiptToTransaction = (receiptIndex, transactionId) => {
    setReceiptsToLink(prev =>
      prev.map((receipt, i) =>
        i === receiptIndex ? { ...receipt, linkedTransactionId: transactionId } : receipt
      )
    );
  };

  const unlinkReceipt = (receiptIndex) => {
    setReceiptsToLink(prev =>
      prev.map((receipt, i) =>
        i === receiptIndex ? { ...receipt, linkedTransactionId: null } : receipt
      )
    );
    setSearchTerms(prev => ({ ...prev, [receiptIndex]: '' }));
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);

    try {
      // Upload each receipt
      for (const receipt of receiptsToLink) {
        // Upload file to storage
        const fileExt = receipt.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `receipts/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bookkeeping-statements')
          .upload(filePath, receipt.file);

        if (uploadError) throw uploadError;

        if (receipt.linkedTransactionId) {
          // Update existing transaction with receipt URL
          const { error: updateError } = await supabase
            .from('bookkeeping_transactions')
            .update({ receipt_url: filePath })
            .eq('id', receipt.linkedTransactionId);

          if (updateError) throw updateError;
        } else {
          // Create a standalone transaction record for unlinked receipt
          const today = new Date().toISOString().split('T')[0];
          const { error: insertError } = await supabase
            .from('bookkeeping_transactions')
            .insert([{
              user_id: user.id,
              transaction_date: today,
              merchant: 'Unlinked Receipt',
              amount: 0,
              type: 'expense',
              category: null,
              description: 'Receipt uploaded without transaction link',
              source: 'receipt_upload',
              receipt_url: filePath
            }]);

          if (insertError) throw insertError;
        }

        // Clean up preview URL
        URL.revokeObjectURL(receipt.previewUrl);
      }

      setStep('complete');

      // Notify parent to refresh
      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error uploading receipts:', err);
      setError(err.message || 'Failed to upload receipts. Please try again.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const linkedCount = receiptsToLink.filter(r => r.linkedTransactionId).length;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Upload Receipts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === 'upload' && 'Upload receipt images and link them to transactions'}
              {step === 'link' && `Link ${files.length} receipt${files.length !== 1 ? 's' : ''} to transactions`}
              {step === 'complete' && 'Upload complete!'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div>
              {/* Drag & Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-24 px-12 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Drop receipt images here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supports JPG, PNG, WebP (max 10MB per file)
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Preview Selected Files */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selected Files ({files.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleProceedToLink}
                  disabled={files.length === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Next: Link to Transactions
                </button>
              </div>
            </div>
          )}

          {/* Link Step */}
          {step === 'link' && (
            <div>
              <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Link each receipt to a transaction by searching for merchant, amount, or date. Unlinked receipts will be uploaded as standalone items that you can link later.
                </p>
              </div>

              <div className="space-y-6">
                {receiptsToLink.map((receipt, index) => (
                  <div
                    key={receipt.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex gap-4">
                      {/* Receipt Preview */}
                      <div className="flex-shrink-0 w-32 h-32 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                        <img
                          src={receipt.previewUrl}
                          alt={`Receipt ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Link Controls */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Receipt {index + 1}
                          </h4>
                          {receipt.linkedTransactionId && (
                            <button
                              onClick={() => unlinkReceipt(index)}
                              className="text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                              Unlink
                            </button>
                          )}
                        </div>

                        {!receipt.linkedTransactionId ? (
                          <>
                            {/* Search Box */}
                            <div className="relative mb-3">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search transactions by merchant, amount, or date..."
                                value={searchTerms[index] || ''}
                                onChange={(e) => setSearchTerms(prev => ({ ...prev, [index]: e.target.value }))}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            {/* Matching Transactions */}
                            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                              {getFilteredTransactions(index).length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                  No matching transactions found
                                </div>
                              ) : (
                                getFilteredTransactions(index).slice(0, 5).map((tx) => (
                                  <button
                                    key={tx.id}
                                    onClick={() => linkReceiptToTransaction(index, tx.id)}
                                    className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {tx.merchant}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          {formatDateDisplay(tx.transaction_date)} • {tx.category || 'Uncategorized'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className={`text-sm font-semibold ${
                                          tx.type === 'revenue'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-900 dark:text-gray-100'
                                        }`}>
                                          ${tx.amount.toFixed(2)}
                                        </p>
                                        <LinkIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 inline ml-2" />
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        ) : (
                          // Linked Transaction Display
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                Linked to transaction
                              </span>
                            </div>
                            {(() => {
                              const linkedTx = transactions.find(tx => tx.id === receipt.linkedTransactionId);
                              return linkedTx ? (
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  <p className="font-medium">{linkedTx.merchant}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatDateDisplay(linkedTx.transaction_date)} • ${linkedTx.amount.toFixed(2)} • {linkedTx.category || 'Uncategorized'}
                                  </p>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep('upload')}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {linkedCount} of {receiptsToLink.length} linked
                  </span>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {uploading ? 'Uploading...' : `Upload ${receiptsToLink.length} Receipt${receiptsToLink.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Upload Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {receiptsToLink.length} receipt{receiptsToLink.length !== 1 ? 's' : ''} uploaded.
                {linkedCount > 0 && (
                  <> {linkedCount} linked to transaction{linkedCount !== 1 ? 's' : ''}.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadReceiptsModal;
