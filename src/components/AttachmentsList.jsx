import React, { useState, useRef } from 'react';
import { FileText, FileAudio, FileImage, Download, Trash2, ExternalLink, X, Play, Pause } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const AttachmentsList = ({ attachments, onAttachmentDeleted }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);
  const { user } = useAuth();

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType === 'application/pdf') return FileText;
    if (fileType.startsWith('audio/')) return FileAudio;
    return FileText;
  };

  const getFileColor = (fileType) => {
    if (fileType.startsWith('image/')) return 'text-blue-500';
    if (fileType === 'application/pdf') return 'text-red-500';
    if (fileType.startsWith('audio/')) return 'text-purple-500';
    return 'text-gray-500';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = async (attachment) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete ${attachment.file_name}?`)) return;

    setDeletingId(attachment.id);

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('note-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('note_attachments')
        .delete()
        .eq('id', attachment.id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      onAttachmentDeleted?.(attachment.id);

    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (attachment) => {
    window.open(attachment.file_url, '_blank');
  };

  const handleImageClick = (attachment) => {
    if (attachment.file_type.startsWith('image/')) {
      setPreviewImage(attachment);
    }
  };

  const toggleAudioPlay = (attachment) => {
    if (playingAudioId === attachment.id) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Play new audio
      setPlayingAudioId(attachment.id);
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Attachments ({attachments.length})
        </h3>
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.file_type);
            const colorClass = getFileColor(attachment.file_type);
            const isDeleting = deletingId === attachment.id;
            const isImage = attachment.file_type.startsWith('image/');
            const isAudio = attachment.file_type.startsWith('audio/');
            const isPlaying = playingAudioId === attachment.id;

            return (
              <div
                key={attachment.id}
                className={`p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-600 transition-colors ${
                  isDeleting ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* File Icon */}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${colorClass}`} />

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${
                        isImage ? 'cursor-pointer hover:text-violet-600 dark:hover:text-violet-400' : ''
                      }`}
                      onClick={() => isImage && handleImageClick(attachment)}
                      title={attachment.file_name}
                    >
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Play/Pause button for audio */}
                    {isAudio && (
                      <button
                        onClick={() => toggleAudioPlay(attachment)}
                        className="p-2 hover:bg-violet-100 dark:hover:bg-violet-900/20 rounded transition-colors"
                        title={isPlaying ? 'Pause' : 'Play'}
                        disabled={isDeleting}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <Play className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        )}
                      </button>
                    )}

                    {/* Download button */}
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Download"
                      disabled={isDeleting}
                    >
                      <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(attachment)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Audio Player */}
                {isAudio && isPlaying && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <audio
                      ref={audioRef}
                      src={attachment.file_url}
                      controls
                      autoPlay
                      crossOrigin="anonymous"
                      className="w-full h-12"
                      onEnded={() => setPlayingAudioId(null)}
                      onError={() => {
                        alert('Failed to load audio file. Please ensure the file is a valid MP3, WAV, or OGG file.');
                        setPlayingAudioId(null);
                      }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={previewImage.file_url}
              alt={previewImage.file_name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />

            {/* File name */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
              <p className="text-sm font-medium truncate">{previewImage.file_name}</p>
              <p className="text-xs text-gray-300">{formatFileSize(previewImage.file_size)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentsList;
