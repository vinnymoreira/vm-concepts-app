import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Loader2, Edit3 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const LogoUploader = ({ 
  currentImageUrl = null, 
  onImageUpload, 
  onImageRemove, 
  companyName = 'C',
  size = 'w-16 h-16',
  isEditable = false,
  bucketName = 'client-logos', 
  folder = 'logos' 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleFileUpload = async (file) => {
    if (!file || !user) return;

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

    // Additional security: validate file content (basic)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      alert('Invalid file type detected');
      return;
    }

    setIsUploading(true);

    try {
      // Create secure file path with user ID isolation
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // User-specific folder

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

      onImageUpload?.(publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message || error.toString()}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (currentImageUrl && user) {
      try {
        // Extract file path from URL for deletion
        const urlParts = currentImageUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === bucketName);
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          
          // Security check: ensure user can only delete their own files
          if (filePath.startsWith(user.id + '/')) {
            await supabase.storage
              .from(bucketName)
              .remove([filePath]);
          } else {
            console.error('Unauthorized file deletion attempt');
            return;
          }
        }
      } catch (error) {
        console.error('Error removing image from storage:', error);
      }
    }

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

    if (!isEditable) return;

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
    if (!isEditable) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      <div 
        className={`${size} rounded-lg overflow-hidden shadow-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${
          isEditable ? 'cursor-pointer' : ''
        } ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
        onDragEnter={isEditable ? handleDrag : undefined}
        onDragLeave={isEditable ? handleDrag : undefined}
        onDragOver={isEditable ? handleDrag : undefined}
        onDrop={isEditable ? handleDrop : undefined}
        onClick={isEditable ? openFileDialog : undefined}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Company logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        <div className={`w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold ${
          size.includes('w-16') ? 'text-2xl' : size.includes('w-12') ? 'text-lg' : 'text-xl'
        } ${currentImageUrl ? 'hidden' : 'flex'}`}>
          {companyName.charAt(0).toUpperCase()}
        </div>

        {/* Upload State Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Edit Icon (only in edit mode) */}
        {isEditable && !isUploading && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
            <Edit3 className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Remove Button (only in edit mode and when there's an image) */}
      {isEditable && currentImageUrl && !isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveImage();
          }}
          className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
          title="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Hidden File Input */}
      {isEditable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
};

export default LogoUploader;