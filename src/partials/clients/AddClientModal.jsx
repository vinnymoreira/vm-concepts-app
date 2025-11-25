import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import ToggleSwitch from '../../components/ToggleSwitch';

const initialClientState = {
  company: '',
  name: '',
  email: '',
  phone: '',
  website: '',
  logo_url: null,
  status: 'active',
  additionalInfo: []
};

const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

function AddClientModal({ isOpen, onClose, onAddClient }) {
  const [newClient, setNewClient] = useState(initialClientState);
  const [errors, setErrors] = useState({});

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    setNewClient(prev => ({ ...prev, [name]: updatedValue }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddField = () => {
    setNewClient(prev => ({
      ...prev,
      additionalInfo: [...prev.additionalInfo, { key: '', value: '' }]
    }));
  };

  const handleRemoveField = (index) => {
    setNewClient(prev => ({
      ...prev,
      additionalInfo: prev.additionalInfo.filter((_, i) => i !== index)
    }));
  };

  const handleAdditionalInfoChange = (index, field, value) => {
    setNewClient(prev => ({
      ...prev,
      additionalInfo: prev.additionalInfo.map((info, i) =>
        i === index ? { ...info, [field]: value } : info
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!newClient.company || !newClient.company.trim()) {
      newErrors.company = 'Company is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onAddClient(newClient);
    handleClose();
  };

  const handleClose = () => {
    setNewClient(initialClientState);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Client</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company"
              value={newClient.company}
              onChange={handleInputChange}
              placeholder="Company name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white ${
                errors.company ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
          </div>

          {/* Contact Name and Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                name="name"
                value={newClient.name}
                onChange={handleInputChange}
                placeholder="Contact name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={newClient.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Phone and Website Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={newClient.phone}
                onChange={handleInputChange}
                placeholder="(555) 555-5555"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={newClient.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Company Logo Upload */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports JPG, PNG,<br /> WebP. Max 5MB.
              </p>
            </div>
            <div className="flex-grow">
              <ImageUpload
                currentImageUrl={newClient.logo_url}
                onImageUpload={(url) => setNewClient(prev => ({ ...prev, logo_url: url }))}
                onImageRemove={() => setNewClient(prev => ({ ...prev, logo_url: null }))}
                hideLabel={true}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <div className="flex items-center gap-3">
              <ToggleSwitch
                isOn={newClient.status === 'active'}
                handleToggle={() => setNewClient(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                onColor="bg-green-500"
              />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                newClient.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {newClient.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Additional Info Section */}
          {newClient.additionalInfo.length > 0 && (
            <div className="pt-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Info</h3>
              <div className="space-y-2">
                {newClient.additionalInfo.map((info, index) => (
                  <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2">
                    <input
                      type="text"
                      value={info.key}
                      onChange={(e) => handleAdditionalInfoChange(index, 'key', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Field name"
                    />
                    <input
                      type="text"
                      value={info.value}
                      onChange={(e) => handleAdditionalInfoChange(index, 'value', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveField(index)}
                      className="px-3 py-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddField}
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Custom Field</span>
          </button>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClientModal;
