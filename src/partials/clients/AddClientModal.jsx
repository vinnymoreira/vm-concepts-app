import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';

const initialClientState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  logo_url: null,
  status: 'active', // Ensure this is set to 'active' by default
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

  useEffect(() => {
    // console.log("Initial newClient state:", newClient);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'phone' ? formatPhoneNumber(value) : value;
    setNewClient(prev => {
      const updated = { ...prev, [name]: updatedValue };
      console.log(`Field '${name}' updated. New state:`, updated);
      return updated;
    });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log("Submitting client data:", newClient);
    onAddClient(newClient);
    setNewClient(initialClientState);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Client</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Company Logo Upload */}
          <div className="mb-6">
            <ImageUpload
              currentImageUrl={newClient.logo_url}
              onImageUpload={(url) => setNewClient(prev => ({ ...prev, logo_url: url }))}
              onImageRemove={() => setNewClient(prev => ({ ...prev, logo_url: null }))}
            />
          </div>

          {['name', 'email', 'phone', 'company', 'website', 'status'].map((field) => (
            <div key={field} className="mb-4">
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              {field === 'status' ? (
                <select
                  id={field}
                  name={field}
                  value={newClient[field]}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : (
                <input
                  type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                  id={field}
                  name={field}
                  value={newClient[field]}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required={field === 'name' || field === 'email'}
                />
              )}
            </div>
          ))}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Additional Info</h3>
            {newClient.additionalInfo.map((info, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={info.key}
                  onChange={(e) => handleAdditionalInfoChange(index, 'key', e.target.value)}
                  className="mr-2 p-2 border border-gray-300 rounded-md flex-grow"
                  placeholder="Field"
                />
                <input
                  type="text"
                  value={info.value}
                  onChange={(e) => handleAdditionalInfoChange(index, 'value', e.target.value)}
                  className="mr-2 p-2 border border-gray-300 rounded-md flex-grow"
                  placeholder="Value"
                />
                <button type="button" onClick={() => handleRemoveField(index)} className="text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddField}
              className="mt-2 text-blue-500 hover:text-blue-600 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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