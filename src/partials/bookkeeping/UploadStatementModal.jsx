import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Loader2, Trash2, CheckCircle } from 'lucide-react';
import { extractTransactionsFromPDF, validatePDFFile } from '../../utils/pdfParser';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import CategoryAutocomplete from '../../components/CategoryAutocomplete';

function UploadStatementModal({ isOpen, onClose, onImportComplete, categories }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'complete'
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Format date for display without timezone conversion
  // YYYY-MM-DD string -> MM/DD/YYYY display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setExtractedTransactions([]);
      setStep('upload');
      setError(null);
      setProcessing(false);
      setImporting(false);
    }
  }, [isOpen]);

  // Handle Escape key - disabled, only allow closing via X button
  // useEffect(() => {
  //   const handleEscape = (e) => {
  //     if (e.key === 'Escape' && isOpen && !processing && !importing) {
  //       handleClose();
  //     }
  //   };

  //   if (isOpen) {
  //     document.addEventListener('keydown', handleEscape);
  //   }

  //   return () => {
  //     document.removeEventListener('keydown', handleEscape);
  //   };
  // }, [isOpen, processing, importing]);

  const handleClose = () => {
    if (!processing && !importing) {
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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile) => {
    setError(null);

    // Validate file
    const validation = validatePDFFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setFile(selectedFile);
    setProcessing(true);

    try {
      // Extract transactions from PDF
      const transactions = await extractTransactionsFromPDF(selectedFile);

      if (transactions.length === 0) {
        setError('No transactions found in PDF. The file may be scanned or in an unsupported format.');
        setProcessing(false);
        return;
      }

      setExtractedTransactions(transactions);
      setStep('preview');
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err.message || 'Failed to process PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const updateTransaction = (index, field, value) => {
    setExtractedTransactions(prev =>
      prev.map((t, i) => i === index ? { ...t, [field]: value } : t)
    );
  };

  const removeTransaction = (index) => {
    setExtractedTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (!user || extractedTransactions.length === 0) return;

    // Check if all transactions have categories
    const missingCategories = extractedTransactions.filter(t => !t.category);
    if (missingCategories.length > 0) {
      setError(`Please assign categories to all transactions (${missingCategories.length} missing)`);
      return;
    }

    setImporting(true);
    setError(null);

    try {
      // Upload PDF to storage first
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `statements/${user.id}/${fileName}`;

      console.log('Uploading file to storage...', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bookkeeping-statements')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bookkeeping-statements')
        .getPublicUrl(filePath);

      console.log('Creating statement record...');
      // Create statement record
      const { data: statementData, error: statementError } = await supabase
        .from('bookkeeping_statements')
        .insert([{
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          status: 'completed',
          transactions_extracted: extractedTransactions.length
        }])
        .select()
        .single();

      if (statementError) {
        console.error('Statement insert error:', statementError);
        throw statementError;
      }

      console.log('Statement created:', statementData);

      // Insert all transactions - only include allowed fields
      const transactionsToInsert = extractedTransactions.map(t => ({
        user_id: user.id,
        transaction_date: t.transaction_date,
        merchant: t.merchant,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description || '',
        source: t.source || 'pdf_upload',
        statement_file_id: statementData.id
      }));

      console.log('Inserting transactions...', transactionsToInsert.length, 'transactions');
      console.log('Sample transaction:', transactionsToInsert[0]);

      const { data: insertedTransactions, error: transactionsError } = await supabase
        .from('bookkeeping_transactions')
        .insert(transactionsToInsert)
        .select();

      if (transactionsError) {
        console.error('Transaction insert error:', transactionsError);
        console.error('Full error details:', JSON.stringify(transactionsError, null, 2));
        throw transactionsError;
      }

      console.log('Transactions inserted successfully:', insertedTransactions?.length);

      setStep('complete');

      // Notify parent to refresh
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error importing transactions:', err);
      setError(err.message || 'Failed to import transactions. Please try again.');
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Upload Statement
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === 'upload' && 'Upload a PDF credit card statement'}
              {step === 'preview' && `Preview and categorize ${extractedTransactions.length} transactions`}
              {step === 'complete' && 'Import complete!'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={processing || importing}
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
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !processing && fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-36 px-12 text-center">
                  {processing ? (
                    <>
                      <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Processing PDF...
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Extracting transactions from {file?.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Drop your PDF here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Supports credit card statements in PDF format (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={processing}
              />

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div>
              {file && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {extractedTransactions.length} transactions found
                    </p>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Merchant</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {extractedTransactions.map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {formatDateDisplay(transaction.transaction_date)}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <input
                            type="text"
                            value={transaction.merchant}
                            onChange={(e) => updateTransaction(index, 'merchant', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <CategoryAutocomplete
                            value={transaction.category}
                            onChange={(value) => updateTransaction(index, 'category', value)}
                            categories={expenseCategories.map(cat => cat.name)}
                            placeholder="Type to search..."
                            error={!transaction.category}
                            className="text-sm py-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeTransaction(index)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setExtractedTransactions([]);
                    setError(null);
                  }}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || extractedTransactions.length === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import {extractedTransactions.length} Transaction{extractedTransactions.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Import Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {extractedTransactions.length} transactions have been added to your bookkeeping.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadStatementModal;
