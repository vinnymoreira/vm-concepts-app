import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Copy, Check } from 'lucide-react';

function AISuggestionModal({ isOpen, onClose, onApplySuggestion, onGenerateSuggestion, suggestion: externalSuggestion, loading: externalLoading, categoryName }) {
  const [suggestionType, setSuggestionType] = useState('continue');
  const [copied, setCopied] = useState(false);

  // Use external suggestion and loading state
  const suggestion = externalSuggestion || '';
  const loading = externalLoading || false;

  // Auto-generate on mount if modal opens
  useEffect(() => {
    if (isOpen && !suggestion && !loading) {
      onGenerateSuggestion(suggestionType);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const suggestionTypes = [
    { value: 'continue', label: 'Continue Writing', description: 'Generate the next lines or paragraph' },
    { value: 'expand', label: 'Expand Ideas', description: 'Add more detail and elaboration' },
    { value: 'rewrite', label: 'Rewrite', description: 'Rewrite in a different way' },
    { value: 'brainstorm', label: 'Brainstorm', description: 'Get new ideas and directions' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplySuggestion(suggestion);
    setSuggestionType('continue');
    onClose();
  };

  const handleRegenerateSuggestion = () => {
    onGenerateSuggestion(suggestionType);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                AI Content Suggestions
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Suggestion Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What would you like help with?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestionTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSuggestionType(type.value);
                      onGenerateSuggestion(type.value);
                    }}
                    disabled={loading}
                    className={`p-3 text-left rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      suggestionType === type.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Context */}
            {categoryName && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> AI will consider your "{categoryName}" category context when generating suggestions.
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Generating suggestion...</span>
              </div>
            )}

            {/* Suggestion Display */}
            {suggestion && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Suggestion
                  </label>
                  <button
                    onClick={handleCopy}
                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200">
                      {suggestion}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div>
              {suggestion && !loading && (
                <button
                  onClick={handleRegenerateSuggestion}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {suggestion && !loading && (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Insert into Note
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AISuggestionModal;
