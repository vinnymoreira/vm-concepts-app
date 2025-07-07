import React, { useState, useRef } from 'react';
import { Upload, X, Camera, Loader2, Edit3, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const AvatarUploader = ({ 
  currentImageUrl = null, 
  onImageUpload, 
  onImageRemove, 
  userName = 'User',
  size = 'w-16 h-16',
  isEditable = false,
  bucketName = 'avatars', 
  folder = 'profile-pictures' 
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

    setIsUploading(true);

    try {
      // Create secure file path with user ID isolation
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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
      console.error('Error uploading avatar:', error);
      alert(`Failed to upload avatar: ${error.message || error.toString()}`);
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
        console.error('Error removing avatar from storage:', error);
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

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Check if the image is from Google (for Google OAuth users)
  const isGoogleAvatar = currentImageUrl && currentImageUrl.includes('googleusercontent.com');

  return (
    <div className="relative group">
      <div 
        className={`${size} rounded-full overflow-hidden shadow-md bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 ${
          isEditable ? 'cursor-pointer' : ''
        } ${dragActive ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : ''}`}
        onDragEnter={isEditable ? handleDrag : undefined}
        onDragLeave={isEditable ? handleDrag : undefined}
        onDragOver={isEditable ? handleDrag : undefined}
        onDrop={isEditable ? handleDrop : undefined}
        onClick={isEditable ? openFileDialog : undefined}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt={`${userName}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback avatar with initials */}
        <div className={`w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold ${
          size.includes('w-24') ? 'text-2xl' : size.includes('w-16') ? 'text-xl' : size.includes('w-12') ? 'text-lg' : 'text-base'
        } ${currentImageUrl ? 'hidden' : 'flex'}`}>
          {getInitials(userName)}
        </div>

        {/* Upload State Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}

        {/* Edit Icon (only in edit mode) */}
        {isEditable && !isUploading && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 hover:bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
            <Camera className="w-4 h-4" />
          </div>
        )}

        {/* Google Badge (for Google OAuth avatars) */}
        {isGoogleAvatar && (
          <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg text-xs font-bold">
            G
          </div>
        )}
      </div>

      {/* Remove Button (only in edit mode and when there's a custom uploaded image) */}
      {isEditable && currentImageUrl && !isGoogleAvatar && !isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveImage();
          }}
          className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
          title="Remove avatar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Upload prompt overlay (when dragging) */}
      {dragActive && isEditable && (
        <div className="absolute inset-0 bg-violet-500 bg-opacity-80 rounded-full flex items-center justify-center">
          <div className="text-center text-white">
            <Upload className="w-8 h-8 mx-auto mb-1" />
            <p className="text-sm font-medium">Drop to upload</p>
          </div>
        </div>
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

export default AvatarUploader;