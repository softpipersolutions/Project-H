# OAuth Setup Guide for Synthera

## 🔐 Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Project name: `Synthera`
4. Click "Create"

### Step 2: Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: `Synthera`
   - User support email: `your-email@domain.com`
   - Developer contact: `your-email@domain.com`
4. Click "Save and Continue"
5. Skip scopes (click "Save and Continue")
6. Add test users if needed, then "Save and Continue"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: `Synthera OAuth`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
6. Click "Create"
7. Copy the Client ID and Client Secret

### Environment Variables:
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 🐙 GitHub OAuth Setup

### Step 1: Create OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"

### Step 2: Configure App
1. Application name: `Synthera`
2. Homepage URL: `https://yourdomain.com`
3. Application description: `AI Video Platform`
4. Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`
   - For development: `http://localhost:3000/api/auth/callback/github`
5. Click "Register application"

### Step 3: Generate Client Secret
1. Click "Generate a new client secret"
2. Copy both Client ID and Client Secret

### Environment Variables:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## 🎮 Discord OAuth Setup

### Step 1: Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name: `Synthera`
4. Click "Create"

### Step 2: Configure OAuth2
1. Go to "OAuth2" → "General"
2. Copy the Client ID and Client Secret
3. Under "Redirects", add:
   - `http://localhost:3000/api/auth/callback/discord`
   - `https://yourdomain.com/api/auth/callback/discord`
4. Click "Save Changes"

### Environment Variables:
```env
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

---

## 🧪 Testing OAuth Setup

### 1. Update your .env.local file with the credentials
### 2. Start your development server:
```bash
npm run dev
```

### 3. Visit http://localhost:3000/auth/signin
### 4. Test each OAuth provider

---

## 🚀 Production Deployment Notes

### When deploying to production:

1. **Update OAuth Redirect URLs** in all provider consoles:
   - Google: Add `https://yourdomain.com/api/auth/callback/google`
   - GitHub: Update Authorization callback URL to `https://yourdomain.com/api/auth/callback/github`
   - Discord: Add `https://yourdomain.com/api/auth/callback/discord`

2. **Update NEXTAUTH_URL** environment variable:
   ```env
   NEXTAUTH_URL="https://yourdomain.com"
   ```

3. **Google OAuth Consent Screen**:
   - Change from "Testing" to "In production" mode
   - Submit for verification if using sensitive scopes

4. **Domain Verification**:
   - Add your domain to authorized domains in Google Cloud Console
   - Verify domain ownership if required

---

## ⚠️ Common Issues

### "redirect_uri_mismatch" Error
- Ensure redirect URIs match exactly in provider console
- Check for trailing slashes or http vs https

### "Client ID not found" Error
- Verify environment variables are set correctly
- Restart your development server after adding variables

### "Access denied" Error
- Check OAuth consent screen configuration
- Ensure app is published (not in testing mode)

### "Invalid client" Error
- Verify client secret is correct
- Check if client secret has expired (GitHub)

---

## 🔄 Next Steps

After setting up OAuth:
1. Test authentication locally
2. Set up Stripe payments
3. Configure file storage
4. Deploy to production
5. Update production OAuth settings