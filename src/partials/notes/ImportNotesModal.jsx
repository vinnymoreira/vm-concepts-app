import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

function ImportNotesModal({ isOpen, onClose, onNotesImported, categories }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
    setImportResults(null);
  };

  const parseMarkdownToTiptap = (markdown) => {
    // Basic markdown to Tiptap JSON converter
    // This is a simplified version - you can enhance it for more complex markdown
    const lines = markdown.split('\n');
    const content = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line.trim()) {
        // Empty line
        content.push({ type: 'paragraph' });
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        content.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: line.substring(2) }]
        });
      } else if (line.startsWith('## ')) {
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: line.substring(3) }]
        });
      } else if (line.startsWith('### ')) {
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: line.substring(4) }]
        });
      }
      // Blockquote
      else if (line.startsWith('> ')) {
        content.push({
          type: 'blockquote',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: line.substring(2) }]
          }]
        });
      }
      // Unordered list
      else if (line.match(/^[*-]\s/)) {
        content.push({
          type: 'bulletList',
          content: [{
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: line.substring(2) }]
            }]
          }]
        });
      }
      // Ordered list
      else if (line.match(/^\d+\.\s/)) {
        const text = line.replace(/^\d+\.\s/, '');
        content.push({
          type: 'orderedList',
          content: [{
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text }]
            }]
          }]
        });
      }
      // Task list
      else if (line.match(/^-?\s*\[[ x]\]/i)) {
        const checked = line.match(/\[x\]/i) !== null;
        const text = line.replace(/^-?\s*\[[ x]\]\s*/i, '');
        content.push({
          type: 'taskList',
          content: [{
            type: 'taskItem',
            attrs: { checked },
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text }]
            }]
          }]
        });
      }
      // Horizontal rule
      else if (line.match(/^---+$/)) {
        content.push({ type: 'horizontalRule' });
      }
      // Regular paragraph
      else {
        // Handle inline formatting
        let text = line;
        const textNodes = [];

        // Simple bold/italic detection (basic implementation)
        if (text.includes('**') || text.includes('*') || text.includes('`')) {
          // For simplicity, just add as plain text
          // You can enhance this to parse inline formatting
          textNodes.push({ type: 'text', text });
        } else {
          textNodes.push({ type: 'text', text });
        }

        content.push({
          type: 'paragraph',
          content: textNodes
        });
      }
    }

    return {
      type: 'doc',
      content: content.length > 0 ? content : [{ type: 'paragraph' }]
    };
  };

  const extractTitle = (markdown) => {
    // Try to extract title from first heading or first line
    const lines = markdown.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.substring(2).trim();
      }
    }
    // Use first non-empty line as title
    for (const line of lines) {
      if (line.trim()) {
        return line.trim().substring(0, 100);
      }
    }
    return 'Imported Note';
  };

  const handleImport = async () => {
    if (!user || files.length === 0) {
      setError('Please select files to import');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const file of files) {
        try {
          const text = await file.text();

          // Extract title from filename or content
          const filenameTitle = file.name.replace(/\.md$/i, '');
          const contentTitle = extractTitle(text);
          const title = contentTitle !== 'Imported Note' ? contentTitle : filenameTitle;

          // Parse markdown to Tiptap JSON
          const content = parseMarkdownToTiptap(text);

          // Insert into database
          const { error: insertError } = await supabase
            .from('notes')
            .insert([
              {
                user_id: user.id,
                title,
                content,
                category_id: selectedCategory || null,
              }
            ]);

          if (insertError) throw insertError;

          results.success++;
        } catch (err) {
          console.error(`Error importing ${file.name}:`, err);
          results.failed++;
          results.errors.push(`${file.name}: ${err.message}`);
        }
      }

      setImportResults(results);

      if (results.success > 0) {
        onNotesImported();
      }

      // Close modal after 3 seconds if all successful
      if (results.failed === 0) {
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (err) {
      console.error('Error importing notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setSelectedCategory('');
    setError(null);
    setImportResults(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Import Notes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import Markdown files from Notion or other sources
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {importResults && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <div className="flex items-start gap-2 text-green-800 dark:text-green-400 mb-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Import Complete!</p>
                  <p className="text-sm">Successfully imported {importResults.success} note(s)</p>
                  {importResults.failed > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Failed to import {importResults.failed} note(s)
                    </p>
                  )}
                </div>
              </div>
              {importResults.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {importResults.errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Markdown Files (.md)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".md,.markdown,.txt"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-violet-500 hover:text-violet-600 font-medium"
              >
                Choose files
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or drag and drop
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import to Category (Optional)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Help text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              <strong>Tip:</strong> To export from Notion, select the pages you want to export,
              click the "..." menu, choose "Export", and select "Markdown & CSV" format.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || files.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg flex items-center gap-2"
            >
              {loading ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {files.length > 0 && `(${files.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportNotesModal;
