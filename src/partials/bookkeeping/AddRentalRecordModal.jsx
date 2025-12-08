import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DatePicker from '../../components/Datepicker';

function AddRentalRecordModal({ isOpen, onClose, onSubmit, properties, editRecord = null }) {
  const [formData, setFormData] = useState({
    property_id: '',
    record_date: '',
    rental_income: '',
    mortgage: '',
    maintenance: '',
    property_management: '',
    other_expenses: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editRecord) {
      setFormData({
        property_id: editRecord.property_id || '',
        record_date: editRecord.record_date || '',
        rental_income: editRecord.rental_income || '',
        mortgage: editRecord.mortgage || '',
        maintenance: editRecord.maintenance || '',
        property_management: editRecord.property_management || '',
        other_expenses: editRecord.other_expenses || '',
        notes: editRecord.notes || ''
      });
    } else {
      // Default to first property and current month
      const firstDay = new Date();
      firstDay.setDate(1);
      const dateStr = firstDay.toISOString().split('T')[0];

      setFormData({
        property_id: properties.length > 0 ? properties[0].id : '',
        record_date: dateStr,
        rental_income: '',
        mortgage: '',
        maintenance: '',
        property_management: '',
        other_expenses: '',
        notes: ''
      });
    }
    setErrors({});
  }, [editRecord, isOpen, properties]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.property_id) {
      newErrors.property_id = 'Property is required';
    }
    if (!formData.record_date) {
      newErrors.record_date = 'Date is required';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert string values to numbers, allow 0 and empty strings
    const submitData = {
      property_id: parseInt(formData.property_id),
      record_date: formData.record_date,
      rental_income: formData.rental_income === '' ? 0 : parseFloat(formData.rental_income),
      mortgage: formData.mortgage === '' ? 0 : parseFloat(formData.mortgage),
      maintenance: formData.maintenance === '' ? 0 : parseFloat(formData.maintenance),
      property_management: formData.property_management === '' ? 0 : parseFloat(formData.property_management),
      other_expenses: formData.other_expenses === '' ? 0 : parseFloat(formData.other_expenses),
      notes: formData.notes
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      property_id: '',
      record_date: '',
      rental_income: '',
      mortgage: '',
      maintenance: '',
      property_management: '',
      other_expenses: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editRecord ? 'Edit Monthly Record' : 'Add Monthly Record'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property and Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Property */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property *
              </label>
              <select
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.property_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100`}
              >
                <option value="">Select a property</option>
                {properties
                  .filter(p => p.status === 'active')
                  .map(property => (
                    <option key={property.id} value={property.id}>
                      {property.property_name}
                    </option>
                  ))}
              </select>
              {errors.property_id && (
                <p className="text-red-500 text-sm mt-1">{errors.property_id}</p>
              )}
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <DatePicker
                value={formData.record_date}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, record_date: date }));
                  if (errors.record_date) {
                    setErrors(prev => ({ ...prev, record_date: '' }));
                  }
                }}
                placeholder="mm/dd/yyyy"
                className={`h-[42px] hover:!border-indigo-400 dark:hover:!border-indigo-500 ${
                  errors.record_date ? '!border-red-500' : ''
                }`}
              />
              {errors.record_date && (
                <p className="text-red-500 text-sm mt-1">{errors.record_date}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the first day of the month
              </p>
            </div>
          </div>

          {/* Income Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Income
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rental Income ($0 for vacancy)
              </label>
              <input
                type="number"
                name="rental_income"
                value={formData.rental_income}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Expenses Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Expenses
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Mortgage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mortgage
                </label>
                <input
                  type="number"
                  name="mortgage"
                  value={formData.mortgage}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Maintenance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maintenance & Repairs
                </label>
                <input
                  type="number"
                  name="maintenance"
                  value={formData.maintenance}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Property Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property Management
                </label>
                <input
                  type="number"
                  name="property_management"
                  value={formData.property_management}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Other Expenses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Other Expenses
                </label>
                <input
                  type="number"
                  name="other_expenses"
                  value={formData.other_expenses}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this month..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-lg"
            >
              {editRecord ? 'Update Record' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRentalRecordModal;
