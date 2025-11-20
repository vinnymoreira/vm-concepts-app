# Google Authentication Setup & Troubleshooting

## Issue: Google Sign-In with Previously Registered Email

If you registered with email/password first, then try to sign in with Google using the same email, you might encounter issues. Here's how to fix it:

## Supabase Configuration Steps

### 1. Enable Account Linking (Recommended)

In your Supabase Dashboard:

1. Go to **Authentication** → **Providers** → **Google**
2. Make sure Google provider is **enabled**
3. Add your Google OAuth credentials:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
4. Set the **Redirect URL**: Copy it from Supabase (should look like `https://[your-project].supabase.co/auth/v1/callback`)

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: "VM Concepts App"
   - User support email: your email
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://your-production-domain.com`
   - Authorized redirect URIs:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`
     - `http://localhost:5173` (for development testing)
7. Copy the **Client ID** and **Client Secret**

### 3. Update Supabase Settings

In Supabase Dashboard → **Authentication** → **Settings**:

1. **Confirm email**: Toggle based on your preference
2. **Disable email confirmations** (optional for easier testing)
3. **Enable Email Provider** and **Google Provider**

### 4. Configure Account Linking

In Supabase Dashboard → **Authentication** → **Settings** → **Auth Providers**:

**Important**: Set the following option:
- **Allow account linking**: Enable this to allow users to link Google auth with existing email/password accounts

## Handling Email Already Exists Error

### Option 1: Manual Account Linking (User Action)

If a user has an email/password account and wants to add Google sign-in:

1. User signs in with email/password
2. Go to account settings
3. Click "Link Google Account"
4. This will allow them to sign in with either method

### Option 2: Automatic Handling (Code Solution)

The code has been updated to:

1. **Detect** when Google email matches existing email/password account
2. **Show clear message**: "This email is already registered. Please sign in with your password or try password reset."
3. **Suggest** using password reset if they forgot their password

### Option 3: Allow Duplicate Accounts (Not Recommended)

You could configure Supabase to allow the same email with different auth methods, but this creates duplicate users and is confusing.

## Testing the Fix

### Test Case 1: Email/Password First, Then Google
1. Sign up with `test@example.com` using email/password
2. Sign out
3. Try signing in with Google using `test@example.com`
4. Expected: Should either link accounts or show clear error message

### Test Case 2: Google First, Then Email/Password
1. Sign up with Google (`test@example.com`)
2. Sign out
3. Try signing up with email/password using `test@example.com`
4. Expected: Should show "Email already registered" error

## Current Implementation Features

The updated code includes:

1. **Better error handling**: Specific messages for different error types
2. **Popup detection**: Warns users if popups are blocked
3. **Email conflict detection**: Detects when email is already registered
4. **Console logging**: Errors are logged for debugging
5. **Improved OAuth options**: Added `access_type` and `prompt` for better Google auth flow

## Troubleshooting Common Issues

### Error: "Popup blocked"
**Solution**: Allow popups for your domain in browser settings

### Error: "redirect_uri_mismatch"
**Solution**:
1. Check that redirect URI in Google Cloud Console matches exactly
2. Make sure you added the Supabase callback URL
3. Include both development (`localhost`) and production URLs

### Error: "Email not confirmed"
**Solution**:
1. Check spam folder for verification email
2. Or disable email confirmation in Supabase settings (for testing)
3. Manually verify email in Supabase Dashboard → Authentication → Users

### Google Sign-In Button Does Nothing
**Solution**:
1. Check browser console for errors
2. Verify Google OAuth credentials are correct in Supabase
3. Ensure Google provider is enabled in Supabase
4. Check if popups are blocked

### "This email is already registered" but I want to use Google
**Solutions**:
1. Use "Forgot Password" to reset your password
2. Sign in with email/password, then link Google account (if account linking UI is implemented)
3. Contact admin to merge accounts

## Security Best Practices

1. **Enable email verification** for production
2. **Use HTTPS** for production domains
3. **Keep OAuth secrets secure** (never commit to git)
4. **Rotate credentials** if compromised
5. **Monitor auth logs** in Supabase dashboard

## Additional Features to Consider

### Future Enhancements:
1. **Account Settings Page**: Allow users to:
   - Link/unlink Google account
   - View connected auth methods
   - Manage profile

2. **Social Account Indicator**: Show icon on login page if email has Google linked

3. **One-Click Account Linking**: If user tries Google with existing email:
   - Prompt to sign in with password
   - Automatically link accounts after successful password auth

## Need Help?

Check these resources:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Discord](https://discord.supabase.com)

---

**Note**: After making changes to Supabase settings, you may need to clear browser cache and cookies for testing.
