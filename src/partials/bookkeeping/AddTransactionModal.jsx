import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DatePicker from '../../components/Datepicker';
import CategoryAutocomplete from '../../components/CategoryAutocomplete';
import ReceiptUpload from '../../components/ReceiptUpload';

function AddTransactionModal({ isOpen, onClose, onSave, categories }) {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    merchant: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    receipt_url: null
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        merchant: '',
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        receipt_url: null
      });
      setErrors({});
    }
  }, [isOpen]);

  // Get filtered categories based on type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Reset category when type changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, category: '' }));
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const newCategories = categories.filter(cat => cat.type === newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
      category: newCategories.length > 0 ? newCategories[0].name : ''
    }));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      source: 'manual'
    };

    onSave(transactionData);
  };

  const handleClose = () => {
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      merchant: '',
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      receipt_url: null
    });
    setErrors({});
    onClose();
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  onChange={handleTypeChange}
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
                  onChange={handleTypeChange}
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
              rows="3"
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
