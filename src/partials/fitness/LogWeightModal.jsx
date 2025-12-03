import React from 'react';
import { X } from 'lucide-react';
import DatePicker from '../../components/Datepicker';

const LogWeightModal = ({ 
  isOpen, 
  onClose, 
  onLogWeight, 
  currentWeight, 
  setCurrentWeight, 
  logDate, 
  setLogDate 
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogWeight();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Log Weight</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                className="form-input w-full"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Date
              </label>
              <DatePicker
                value={logDate}
                onChange={setLogDate}
                placeholder="Select date"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Log Weight
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogWeightModal;