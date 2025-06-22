import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const EmailVerification = ({ email, onVerified }) => {
  const [isPolling, setIsPolling] = useState(true);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Show resend button after 30 seconds
    const resendTimer = setTimeout(() => {
      setShowResendButton(true);
    }, 30000);

    // Start polling for verification
    let pollInterval;
    if (isPolling) {
      pollInterval = setInterval(checkVerificationStatus, 3000); // Check every 3 seconds
    }

    // Listen for auth state changes (when user clicks verification link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          setIsPolling(false);
          if (onVerified) {
            onVerified();
          } else {
            navigate('/');
          }
        }
      }
    );

    return () => {
      clearTimeout(resendTimer);
      if (pollInterval) clearInterval(pollInterval);
      subscription.unsubscribe();
    };
  }, [isPolling, onVerified, navigate]);

  const checkVerificationStatus = async () => {
    try {
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        setIsPolling(false);
        if (onVerified) {
          onVerified();
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      setResendMessage('Verification email sent! Check your inbox.');
      setShowResendButton(false);
      
      // Show resend button again after 60 seconds
      setTimeout(() => {
        setShowResendButton(true);
        setResendMessage('');
      }, 60000);

    } catch (error) {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const goBackToLogin = () => {
    if (onVerified) {
      onVerified(false); // Signal to go back
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative overflow-hidden">
        {/* Animated gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-pulse"></div>
        
        {/* Header */}
        <div className="text-center mb-8">
          {/* Email icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-600 mb-4">
            We've sent a verification link to
          </p>
          <p className="text-violet-600 font-semibold break-all">
            {email}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl p-4 border border-violet-100">
            <h3 className="font-semibold text-gray-800 mb-2">What's next?</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the verification link in the email</li>
              <li>3. You'll be automatically signed in</li>
            </ol>
          </div>

          {/* Polling indicator */}
          {isPolling && (
            <div className="flex items-center justify-center space-x-2 text-violet-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent"></div>
              <span className="text-sm">Waiting for verification...</span>
            </div>
          )}

          {/* Resend email */}
          {showResendButton && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Didn't receive the email?</p>
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend Email'}
              </button>
            </div>
          )}

          {/* Resend message */}
          {resendMessage && (
            <div className={`text-center text-sm p-3 rounded-lg ${
              resendMessage.includes('sent') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {resendMessage}
            </div>
          )}

          {/* Back to login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={goBackToLogin}
              className="text-violet-600 hover:text-violet-800 font-medium text-sm transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;