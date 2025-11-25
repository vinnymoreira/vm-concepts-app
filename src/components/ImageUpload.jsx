import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ImageUpload = ({ currentImageUrl = null, onImageUpload, onImageRemove, bucketName = 'client-logos', folder = 'logos', hideLabel = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onImageUpload?.(publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (currentImageUrl) {
      try {
        // Extract file path from URL for deletion
        const urlParts = currentImageUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === bucketName);
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          
          // Delete from Supabase Storage
          await supabase.storage
            .from(bucketName)
            .remove([filePath]);
        }
      } catch (error) {
        console.error('Error removing image from storage:', error);
      }
    }

    setPreviewUrl(null);
    onImageRemove?.();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {!hideLabel && (
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
          <Camera className="w-4 h-4 mr-2 text-indigo-500" />
          Company Logo
        </div>
      )}

      {previewUrl ? (
        // Image Preview
        <div className="relative group">
          <div className="w-32 h-32 rounded-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Company logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-gray-400">
              <Camera className="w-8 h-8" />
            </div>
          </div>
          
          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Replace Button */}
          <button
            type="button"
            onClick={openFileDialog}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
            title="Change image"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>
        </div>
      ) : (
        // Upload Area
        <div
          className={`relative w-32 h-32 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isUploading ? 'Uploading...' : 'Click or drag logo'}
            </span>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;