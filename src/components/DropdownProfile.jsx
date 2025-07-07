import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Use useAuth instead of useContext
import { supabase } from '../supabaseClient';
import Transition from '../utils/Transition';

import UserAvatar from '../images/user-avatar-32.png';

function DropdownProfile({
  align
}) {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const navigate = useNavigate();

  const trigger = useRef(null);
  const dropdown = useRef(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdown.current) return;
      if (!dropdownOpen || dropdown.current.contains(target) || trigger.current.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  const { user, signOut } = useAuth(); // ✅ Use useAuth hook

  // Load user profile avatar with caching
  useEffect(() => {
    const loadProfileAvatar = async () => {
      if (!user) {
        setAvatarLoading(false);
        return;
      }

      // Check localStorage cache first
      const cacheKey = `avatar_${user.id}`;
      const cachedAvatar = localStorage.getItem(cacheKey);
      
      if (cachedAvatar && cachedAvatar !== 'null') {
        setProfileAvatar(cachedAvatar);
        setAvatarLoading(false);
        
        // Still fetch from database in background to ensure it's up to date
        fetchAvatarFromDB(false);
        return;
      }

      // If no cache, fetch from database
      await fetchAvatarFromDB(true);
    };

    const fetchAvatarFromDB = async (setLoadingState = true) => {
      try {
        if (setLoadingState) setAvatarLoading(true);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        let avatarUrl = null;
        if (profileData?.avatar_url) {
          avatarUrl = profileData.avatar_url;
        } else {
          // Fall back to Google avatar if available
          avatarUrl = user.user_metadata?.avatar_url || null;
        }

        setProfileAvatar(avatarUrl);
        
        // Cache the result
        const cacheKey = `avatar_${user.id}`;
        if (avatarUrl) {
          localStorage.setItem(cacheKey, avatarUrl);
        } else {
          localStorage.removeItem(cacheKey);
        }
        
      } catch (error) {
        console.error('Error loading avatar:', error);
        // Fall back to Google avatar if profile doesn't exist
        const fallbackAvatar = user.user_metadata?.avatar_url || null;
        setProfileAvatar(fallbackAvatar);
        
        // Cache the fallback
        const cacheKey = `avatar_${user.id}`;
        if (fallbackAvatar) {
          localStorage.setItem(cacheKey, fallbackAvatar);
        }
      } finally {
        if (setLoadingState) setAvatarLoading(false);
      }
    };

    loadProfileAvatar();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      // Clear cache on update
      const cacheKey = `avatar_${user.id}`;
      localStorage.removeItem(cacheKey);
      fetchAvatarFromDB(false); // Don't show loading state for updates
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setDropdownOpen(false);
      navigate('/login'); // ✅ Navigate to login page after logout
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Preload avatar image to avoid flicker
  useEffect(() => {
    if (profileAvatar && !avatarError) {
      const img = new Image();
      img.onload = () => {
        // Image is preloaded and ready
      };
      img.onerror = () => {
        setAvatarError(true);
        setProfileAvatar(null);
      };
      img.src = profileAvatar;
    }
  }, [profileAvatar]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="relative inline-flex">
      <button
        ref={trigger}
        className="inline-flex justify-center items-center group"
        aria-haspopup="true"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center relative">
          {profileAvatar && !avatarError ? (
            <img 
              className="w-full h-full object-cover" 
              src={profileAvatar} 
              width="32" 
              height="32" 
              alt="User"
              onLoad={() => setAvatarError(false)}
              onError={() => {
                setAvatarError(true);
                setProfileAvatar(null);
              }}
              style={{ display: avatarError ? 'none' : 'block' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-medium text-sm">
              {getInitials(userName)}
            </div>
          )}
        </div>
        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-600 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'} {/* ✅ Show full name, then email, then fallback */}
          </span>
          <svg className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </button>

      <Transition
        className={`origin-top-right z-10 absolute top-full min-w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
        show={dropdownOpen}
        enter="transition ease-out duration-200 transform"
        enterStart="opacity-0 -translate-y-2"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
      >
        <div
          ref={dropdown}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setDropdownOpen(false)}
        >
          <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-200 dark:border-gray-700/60">
            <div className="font-medium text-gray-800 dark:text-gray-100">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'} {/* ✅ Show full name, then email, then fallback */}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <ul>
                <li>
                  <Link
                    className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex items-center py-1 px-3"
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Edit Profile
                  </Link>
                </li>
                <li>
                  <button
                    className="font-medium text-sm text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center py-1 px-3 w-full text-left"
                    onClick={handleSignOut} // ✅ Use new signOut handler
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="py-1 px-3">
              <Link
                className="font-medium text-sm text-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
                to="/login"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </Transition>
    </div>
  )
}

export default DropdownProfile;