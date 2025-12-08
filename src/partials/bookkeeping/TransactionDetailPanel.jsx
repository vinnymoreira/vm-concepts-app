import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import DatePicker from '../../components/Datepicker';
import CategoryAutocomplete from '../../components/CategoryAutocomplete';
import ReceiptUpload from '../../components/ReceiptUpload';

function TransactionDetailPanel({ isOpen, onClose, transaction, onSave, onDelete, categories }) {
  const [formData, setFormData] = useState({
    transaction_date: '',
    merchant: '',
    amount: '',
    type: 'revenue',
    category: '',
    description: '',
    receipt_url: null
  });
  const [errors, setErrors] = useState({});
  const [multiRevenueEntries, setMultiRevenueEntries] = useState([]);

  // Check if this is add mode (no transaction) or edit mode (has transaction)
  const isAddMode = !transaction;

  useEffect(() => {
    if (transaction) {
      // Edit mode - populate with transaction data
      setFormData({
        transaction_date: transaction.transaction_date,
        merchant: transaction.merchant,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description || '',
        receipt_url: transaction.receipt_url || null
      });
    } else if (isOpen) {
      // Add mode - reset to defaults when modal opens
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        merchant: '',
        amount: '',
        type: 'revenue',
        category: '',
        description: '',
        receipt_url: null
      });
      setMultiRevenueEntries([]);
    }
    setErrors({});
  }, [transaction, isOpen]);

  // Get filtered categories based on type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddRevenueEntry = () => {
    setMultiRevenueEntries(prev => [...prev, {
      transaction_date: new Date().toISOString().split('T')[0],
      amount: ''
    }]);
  };

  const handleRemoveRevenueEntry = (index) => {
    setMultiRevenueEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRevenueEntry = (index, field, value) => {
    setMultiRevenueEntries(prev => prev.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Date is required';
    }
    if (!formData.merchant.trim()) {
      newErrors.merchant = 'Merchant is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Validate additional revenue entries
    if (formData.type === 'revenue' && multiRevenueEntries.length > 0) {
      multiRevenueEntries.forEach((entry, index) => {
        if (!entry.transaction_date) {
          newErrors[`entry_${index}_date`] = 'Date is required';
        }
        if (!entry.amount || parseFloat(entry.amount) <= 0) {
          newErrors[`entry_${index}_amount`] = 'Amount must be greater than 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // For revenue with multiple entries
    if (formData.type === 'revenue' && multiRevenueEntries.length > 0 && isAddMode) {
      const allTransactions = [
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        ...multiRevenueEntries.map(entry => ({
          ...formData,
          transaction_date: entry.transaction_date,
          amount: parseFloat(entry.amount)
        }))
      ];

      // Save all transactions
      for (const transaction of allTransactions) {
        await onSave(transaction, true); // Pass true to indicate batch mode
      }

      // Close panel after all are saved
      onClose();
    } else {
      // Single transaction
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      onSave(transactionData);
    }
  };

  const handleDelete = () => {
    if (transaction && window.confirm(`Are you sure you want to delete this transaction from ${transaction.merchant}?`)) {
      onDelete(transaction.id);
      onClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isAddMode ? 'Add Transaction' : 'Transaction Details'}
              </h2>
              {!isAddMode && transaction && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {transaction.source === 'pdf_upload' ? 'Imported from PDF' : 'Manual Entry'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="revenue"
                    checked={formData.type === 'revenue'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Revenue</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Expense</span>
                </label>
              </div>
            </div>

            {/* Date and Amount Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.transaction_date}
                  onChange={(date) => {
                    setFormData(prev => ({ ...prev, transaction_date: date }));
                    if (errors.transaction_date) {
                      setErrors(prev => ({ ...prev, transaction_date: '' }));
                    }
                  }}
                  placeholder="mm/dd/yyyy"
                  className={`h-[42px] hover:!border-indigo-400 dark:hover:!border-indigo-500 ${
                    errors.transaction_date ? '!border-red-500' : ''
                  }`}
                />
                {errors.transaction_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.transaction_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 ${
                      errors.amount
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Multiple Revenue Entries - Only show in add mode for revenue */}
            {isAddMode && formData.type === 'revenue' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add More Revenue Entries
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRevenueEntry}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>

                {multiRevenueEntries.length > 0 && (
                  <div className="space-y-3">
                    {multiRevenueEntries.map((entry, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Date
                            </label>
                            <DatePicker
                              value={entry.transaction_date}
                              onChange={(date) => handleUpdateRevenueEntry(index, 'transaction_date', date)}
                              placeholder="mm/dd/yyyy"
                              className={`h-[38px] ${
                                errors[`entry_${index}_date`] ? '!border-red-500' : ''
                              }`}
                            />
                            {errors[`entry_${index}_date`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`entry_${index}_date`]}</p>
                            )}
                          </div>

                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Amount
                            </label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                              <input
                                type="number"
                                value={entry.amount}
                                onChange={(e) => handleUpdateRevenueEntry(index, 'amount', e.target.value)}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className={`w-full pl-6 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 ${
                                  errors[`entry_${index}_amount`]
                                    ? 'border-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                              />
                            </div>
                            {errors[`entry_${index}_amount`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`entry_${index}_amount`]}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRevenueEntry(index)}
                            className="px-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Remove entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Same merchant and category will be used for all entries. Only date and amount will vary.
                </p>
              </div>
            )}

            {/* Merchant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Merchant / Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                placeholder="e.g., Amazon, Client Name, Uber"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 ${
                  errors.merchant
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.merchant && (
                <p className="text-red-500 text-sm mt-1">{errors.merchant}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <CategoryAutocomplete
                value={formData.category}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, category: value }));
                  if (errors.category) {
                    setErrors(prev => ({ ...prev, category: '' }));
                  }
                }}
                categories={filteredCategories.map(cat => cat.name)}
                placeholder="Select or type to search..."
                error={!!errors.category}
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Additional details about this transaction..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Receipt (Optional)
              </label>
              <ReceiptUpload
                value={formData.receipt_url}
                onChange={(url) => setFormData(prev => ({ ...prev, receipt_url: url }))}
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className={`flex items-center p-6 border-t border-gray-200 dark:border-gray-700 ${
            isAddMode ? 'justify-end' : 'justify-between'
          }`}>
            {!isAddMode && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg"
              >
                {isAddMode
                  ? (formData.type === 'revenue' ? 'Add Revenue' : 'Add Expense')
                  : 'Save Changes'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TransactionDetailPanel;
