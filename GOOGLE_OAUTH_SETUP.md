# Google OAuth Setup Guide for Mani Me Mobile App

This guide walks you through setting up Google Sign-In for both iOS and Android.

## Current Status
- ✅ iOS Client ID: Already configured in `loginscreen.js`
- ❌ Android Client ID: Needs to be configured

---

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing project
3. Project name suggestion: `Mani Me`

---

## Step 2: Enable Required APIs

1. Navigate to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google Identity Services**
   - **Google Sign-In API** (if available)

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public apps)
3. Fill in required fields:
   - **App name**: `Mani Me`
   - **User support email**: `support@manime.co.uk`
   - **App logo**: Upload your logo
   - **App domain**: `manime.co.uk`
   - **Privacy policy**: `https://manime.co.uk/privacy`
   - **Terms of service**: `https://manime.co.uk/terms`
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Add test users (for development)
6. Submit for verification (for production)

---

## Step 4: Create OAuth 2.0 Credentials

### For Android:

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Android** as application type
4. Fill in:
   - **Name**: `Mani Me Android`
   - **Package name**: `com.manime.app`
   - **SHA-1 fingerprint**: Get this from EAS (see below)

#### Getting SHA-1 Fingerprint for Android:

Run in your terminal:
```bash
cd mani-me-mobile
eas credentials
```

Select:
1. Android
2. production
3. View credentials

The SHA-1 fingerprint will be displayed in the output.

Alternatively, for debug builds:
```bash
# Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Mac/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

5. Click **Create** and copy the **Client ID**

### For Expo Go (Development):

1. Create another OAuth client ID
2. Select **Web application** as application type
3. Name: `Mani Me Expo`
4. Add authorized redirect URI:
   - `https://auth.expo.io/@postin54/mani-me-mobile`
5. Copy the **Client ID**

---

## Step 5: Update Code

After creating credentials, update `mani-me-mobile/screens/loginscreen.js`:

```javascript
// Around line 82
const [request, response, promptAsync] = Google.useAuthRequest({
  iosClientId: "508869526140-uc5k1lo5o20vkcr6jnnlqf0q4f8t5m0s.apps.googleusercontent.com",
  androidClientId: "YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com",
  expoClientId: "YOUR_EXPO_WEB_CLIENT_ID_HERE.apps.googleusercontent.com",
});
```

---

## Step 6: Environment Variables (Optional but Recommended)

Instead of hardcoding client IDs, use environment variables:

1. Create `.env` file in `mani-me-mobile/`:
```env
GOOGLE_IOS_CLIENT_ID=508869526140-xxx.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
GOOGLE_EXPO_CLIENT_ID=your-expo-client-id.apps.googleusercontent.com
```

2. Update `app.config.js`:
```javascript
extra: {
  // ... existing config
  googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
  googleExpoClientId: process.env.GOOGLE_EXPO_CLIENT_ID,
}
```

3. Update `loginscreen.js`:
```javascript
import Constants from 'expo-constants';

const [request, response, promptAsync] = Google.useAuthRequest({
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
  androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
  expoClientId: Constants.expoConfig?.extra?.googleExpoClientId,
});
```

---

## Step 7: Test on Real Device

Google Sign-In may not work in:
- iOS Simulator
- Android Emulator (without Google Play Services)
- Expo Go (needs proper expoClientId)

Test on a real device with the development build:
```bash
eas build --profile development --platform android
```

---

## Troubleshooting

### Error: "Developer Error" or "10:"
- SHA-1 fingerprint doesn't match
- Package name is incorrect
- Run `eas credentials` to verify

### Error: "Sign in cancelled"
- User cancelled the flow
- Check internet connection

### Error: "Network error"
- Device not connected to internet
- Google services blocked

### Google Sign-In button not appearing
- Check `request` is not null
- Verify client IDs are correct

---

## Production Checklist

Before launching with Google Sign-In:

- [ ] OAuth consent screen verified by Google
- [ ] All client IDs configured correctly
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] Privacy policy accessible at configured URL
- [ ] Terms of service accessible at configured URL

---

## Resources

- [Expo Google Authentication Docs](https://docs.expo.dev/guides/google-authentication/)
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Overview](https://developers.google.com/identity/protocols/oauth2)
