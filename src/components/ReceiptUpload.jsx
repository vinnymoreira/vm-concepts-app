import React, { useState, useRef } from 'react';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

function ReceiptUpload({ value, onChange, className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // Generate signed URL when value changes
  React.useEffect(() => {
    const getSignedUrl = async () => {
      if (!value) {
        setImageUrl(null);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from('bookkeeping-statements')
          .createSignedUrl(value, 3600); // 1 hour expiry

        if (error) throw error;
        setImageUrl(data.signedUrl);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError('Failed to load image');
      }
    };

    getSignedUrl();
  }, [value]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      return { isValid: false, error: 'File must be an image (JPG, PNG, WebP, HEIC)' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    return { isValid: true, error: null };
  };

  const handleFile = async (file) => {
    setError(null);

    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `receipts/${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('bookkeeping-statements')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the file path instead of URL (we'll generate signed URLs when displaying)
      onChange(filePath);
    } catch (err) {
      console.error('Error uploading receipt:', err);
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // value is the file path
      await supabase.storage
        .from('bookkeeping-statements')
        .remove([value]);

      onChange(null);
    } catch (err) {
      console.error('Error removing receipt:', err);
      // Still clear the value even if deletion fails
      onChange(null);
    }
  };

  return (
    <div className={className}>
      {value ? (
        // Preview
        <div className="relative group">
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Receipt"
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove receipt"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => imageUrl && window.open(imageUrl, '_blank')}
              disabled={!imageUrl}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileImage className="w-4 h-4" />
              View Full Image
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Change Image
            </button>
          </div>
        </div>
      ) : (
        // Upload Area
        <div
          className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Uploading receipt...
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Drop receipt image here or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, WebP, HEIC (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

export default ReceiptUpload;
