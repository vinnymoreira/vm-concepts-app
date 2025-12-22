import React, { useState, useRef } from 'react';
import { Upload, X, File, Loader2, FileText, FileAudio, FileImage } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const FileUpload = ({ noteId, onFileUploaded, allowedTypes = ['image/*', 'application/pdf', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'] }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType === 'application/pdf') return FileText;
    if (fileType.startsWith('audio/')) return FileAudio;
    return File;
  };

  const validateFile = (file) => {
    // Allow common audio formats and check file extension as fallback
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop();
    const isAudio = file.type.startsWith('audio/') ||
                    ['mp3', 'wav', 'ogg', 'webm'].includes(fileExt);
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isAudio && !isImage && !isPDF) {
      alert(`File type not supported: ${file.type || 'unknown'}\n\nSupported formats:\n- Images: JPG, PNG, GIF, WebP\n- Audio: MP3, WAV, OGG\n- Documents: PDF\n\nNote: .m4a files are not supported. Please convert to MP3.`);
      return false;
    }

    // Special warning for .m4a files
    if (fileExt === 'm4a') {
      alert('M4A files are not supported in all browsers.\n\nPlease convert your audio to MP3 format for best compatibility.');
      return false;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    if (!file || !user) return;

    if (!validateFile(file)) return;

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('note-attachments')
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
        .from('note-attachments')
        .getPublicUrl(filePath);

      // Save attachment record to database
      const { data: attachmentData, error: dbError } = await supabase
        .from('note_attachments')
        .insert([
          {
            user_id: user.id,
            note_id: noteId,
            file_name: file.name,
            file_path: filePath,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if DB insert fails
        await supabase.storage.from('note-attachments').remove([filePath]);
        throw dbError;
      }

      // Notify parent component
      onFileUploaded?.(attachmentData);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative w-full min-h-64 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
          dragActive
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isUploading ? openFileDialog : undefined}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
              <span className="text-base text-gray-600 dark:text-gray-400 font-medium">
                Uploading...
              </span>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-gray-400 mb-4" />
              <span className="text-base text-gray-600 dark:text-gray-400 font-medium mb-2">
                Click or drag files to upload
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">
                Images, PDFs, Audio (MP3, WAV, OGG) - Max 10MB
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.mp3,.wav,.ogg"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};

export default FileUpload;
