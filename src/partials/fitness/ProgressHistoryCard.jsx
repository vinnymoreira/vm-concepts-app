import React, { useState } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import DatePicker from '../../components/Datepicker';

const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + offset);
  
  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const ProgressHistoryCard = ({ 
  weightLogs, 
  editingLogId, 
  setEditingLogId, 
  editWeight, 
  setEditWeight, 
  editDate, 
  setEditDate,
  onSaveEdit,
  onCancelEdit,
  onDeleteLog,
  onLogWeight 
}) => {
  const [showAllHistory, setShowAllHistory] = useState(false);

  const startEditing = (log) => {
    setEditingLogId(log.id);
    setEditWeight(log.weight.toString());
    setEditDate(log.log_date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Progress History</h2>
      </div>
      {weightLogs.length > 0 ? (
        <>
          <div className={`space-y-3 overflow-hidden transition-all duration-300 ${
            showAllHistory ? 'max-h-none' : 'max-h-104'
          }`}>
            {weightLogs
              .sort((a, b) => new Date(b.log_date) - new Date(a.log_date))
              .slice(0, showAllHistory ? weightLogs.length : 10)
              .map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  {editingLogId === log.id ? (
                    <>
                      <div className="flex space-x-2 flex-grow">
                        <DatePicker
                          value={editDate}
                          onChange={setEditDate}
                          placeholder="Select date"
                          className="text-sm"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="form-input text-sm w-20"
                        />
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={onSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDisplayDate(log.log_date)}
                        </div>
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                          {log.weight} lbs
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditing(log)}
                          className="p-1 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
          {weightLogs.length > 10 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showAllHistory ? 'Show Less' : 'View All'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">No weight logs yet</p>
          <button
            onClick={onLogWeight}
            className="mt-3 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
          >
            Log your first weight
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressHistoryCard;