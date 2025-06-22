import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import EmailVerification from './EmailVerification';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    // Only redirect if user is verified
    if (user && user.email_confirmed_at) {
      navigate('/');
    }
  }, [user, navigate]);

  const showMessage = (message, type = 'error') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setError('');
    } else {
      setError(message);
      setSuccessMessage('');
    }
    
    setTimeout(() => {
      setError('');
      setSuccessMessage('');
    }, 5000);
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      showMessage('Please fill in all fields');
      return false;
    }

    if (!validateEmail(formData.email)) {
      showMessage('Please enter a valid email address');
      return false;
    }

    if (isSignUp) {
      if (!formData.name) {
        showMessage('Please enter your full name');
        return false;
      }

      if (formData.password.length < 6) {
        showMessage('Password must be at least 6 characters long');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        showMessage('Passwords do not match');
        return false;
      }

      if (!agreeTerms) {
        showMessage('Please agree to the Terms of Service');
        return false;
      }
    }

    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    clearMessages();

    try {
      showMessage('Signing in...', 'success');
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message.includes('Email not confirmed')) {
          setVerificationEmail(formData.email);
          setShowVerification(true);
          return;
        }
        throw error;
      }
      
      showMessage('Welcome back! Redirecting...', 'success');
    } catch (error) {
      showMessage(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    clearMessages();

    try {
      showMessage('Creating your account...', 'success');
      const { data, error } = await signUp(formData.email, formData.password, {
        data: {
          full_name: formData.name,
          display_name: formData.name
        }
      });
      
      if (error) throw error;

      // Check if user needs email confirmation
      if (data.user && !data.user.email_confirmed_at) {
        setVerificationEmail(formData.email);
        setShowVerification(true);
      } else {
        showMessage('Account created successfully! Redirecting...', 'success');
      }
    } catch (error) {
      showMessage(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      showMessage('Connecting to Google...', 'success');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      showMessage('Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      showMessage('Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      if (error) throw error;
      showMessage('Password reset link sent! Check your email.', 'success');
    } catch (error) {
      showMessage('Failed to send reset email. Please try again.');
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
    setAgreeTerms(false);
    clearMessages();
  };

  const handleVerificationComplete = (verified) => {
    if (verified === false) {
      // User wants to go back to login
      setShowVerification(false);
      setVerificationEmail('');
    } else {
      // User has been verified, they'll be redirected by the useEffect
      setShowVerification(false);
    }
  };

  // Show verification screen if needed
  if (showVerification) {
    return (
      <EmailVerification 
        email={verificationEmail} 
        onVerified={handleVerificationComplete}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative overflow-hidden">
        {/* Animated gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-pulse"></div>
        
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-center font-medium">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Join us today' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg font-medium text-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Form Fields */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 outline-none"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 outline-none"
              required
            />
            {!isSignUp && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 outline-none"
                required={isSignUp}
              />
            </div>
          )}

          {isSignUp && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                required={isSignUp}
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 
              (isSignUp ? 'Creating Account...' : 'Signing In...') :
              (isSignUp ? 'Create Account' : 'Sign In')
            }
          </button>
        </form>

        {/* Switch Mode */}
        <div className="text-center mt-6">
          <span className="text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          </span>
          <button
            onClick={switchMode}
            className="text-violet-600 hover:text-violet-800 font-semibold transition-colors"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;