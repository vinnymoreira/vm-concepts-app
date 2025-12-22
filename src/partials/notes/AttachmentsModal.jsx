import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import AttachmentsList from '../../components/AttachmentsList';

const AttachmentsModal = ({ isOpen, onClose, noteId, attachments, onFileUploaded, onAttachmentDeleted }) => {
  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Attachments
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Upload Area */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Upload Files
              </h3>
              <FileUpload
                noteId={noteId}
                onFileUploaded={onFileUploaded}
              />
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <AttachmentsList
                  attachments={attachments}
                  onAttachmentDeleted={onAttachmentDeleted}
                />
              </div>
            )}

            {/* Empty state */}
            {attachments.length === 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No attachments yet. Upload your first file above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn bg-gray-500 hover:bg-gray-600 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentsModal;
