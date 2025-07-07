import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import AvatarUploader from '../components/AvatarUploader';
import { User, Mail, Calendar, Shield, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    bio: '',
    phone: '',
    location: '',
    website: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Check localStorage cache first for avatar
      const cacheKey = `avatar_${user.id}`;
      const cachedAvatar = localStorage.getItem(cacheKey);
      
      // Check if profile exists in database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If no profile exists, create one with data from auth metadata
      if (!profileData) {
        const initialProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          bio: '',
          phone: '',
          location: '',
          website: '',
          updated_at: new Date().toISOString()
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([initialProfile])
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile({
          full_name: newProfile.full_name || '',
          avatar_url: newProfile.avatar_url || '',
          bio: newProfile.bio || '',
          phone: newProfile.phone || '',
          location: newProfile.location || '',
          website: newProfile.website || ''
        });
      } else {
        const avatarUrl = profileData.avatar_url || cachedAvatar || '';
        setProfile({
          full_name: profileData.full_name || '',
          avatar_url: avatarUrl,
          bio: profileData.bio || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          website: profileData.website || ''
        });
        
        // Update cache if needed
        if (profileData.avatar_url && profileData.avatar_url !== cachedAvatar) {
          localStorage.setItem(cacheKey, profileData.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const updates = {
        id: user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        website: profile.website,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Notify other components that profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpdate = async (newAvatarUrl) => {
    try {
      // Update local state immediately
      setProfile(prev => ({
        ...prev,
        avatar_url: newAvatarUrl
      }));

      // Save to database immediately
      const updates = {
        id: user.id,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) {
        console.error('Error saving avatar to database:', error);
        throw error;
      }

      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
      
      // Notify other components that profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (error) {
      console.error('Error updating avatar:', error);
      setMessage({ type: 'error', text: 'Failed to save avatar' });
      // Revert local state on error
      loadProfile();
    }
  };

  const handleAvatarRemove = async () => {
    try {
      // Update local state immediately
      setProfile(prev => ({
        ...prev,
        avatar_url: ''
      }));

      // Save to database immediately
      const updates = {
        id: user.id,
        avatar_url: null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) {
        console.error('Error removing avatar from database:', error);
        throw error;
      }

      setMessage({ type: 'success', text: 'Avatar removed successfully!' });
      
      // Notify other components that profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (error) {
      console.error('Error removing avatar:', error);
      setMessage({ type: 'error', text: 'Failed to remove avatar' });
      // Revert local state on error
      loadProfile();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                <span className="text-gray-600 dark:text-gray-400">Loading profile...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Profile Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account information and preferences
              </p>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <form onSubmit={updateProfile}>
                {/* Profile Header */}
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-6">
                    <AvatarUploader
                      currentImageUrl={profile.avatar_url}
                      onImageUpload={handleAvatarUpdate}
                      onImageRemove={handleAvatarRemove}
                      userName={profile.full_name || user?.email?.split('@')[0] || 'User'}
                      size="w-24 h-24"
                      isEditable={true}
                      bucketName="avatars"
                      folder="profile-pictures"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {profile.full_name || user?.email?.split('@')[0] || 'User'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4" />
                        {user?.email}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4" />
                          <span>
                            {user?.app_metadata?.provider === 'google' ? 'Google Account' : 'Email Account'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="px-6 py-6 space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        value={profile.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={profile.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;