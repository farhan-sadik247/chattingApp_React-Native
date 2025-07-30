# Appwrite EAS Build Troubleshooting Guide

## Problem
Appwrite works perfectly in Expo Go but fails when building APK with `eas build -p android --profile preview`.

## Root Causes & Solutions

### 1. Environment Variables Not Included in Build

**Problem**: EAS builds don't automatically include `.env` files.

**Solution**: Environment variables are now configured in `eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1",
        "EXPO_PUBLIC_APPWRITE_PROJECT_ID": "6888ef1900086dece436",
        // ... other variables
      }
    }
  }
}
```

### 2. Network Security Configuration

**Problem**: Android APKs may block HTTP/HTTPS connections by default.

**Solution**: Added network security configuration:

- Added `network_security_config.xml` file
- Updated `app.json` with network permissions:
  ```json
  {
    "android": {
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ],
      "usesCleartextTraffic": true,
      "networkSecurityConfig": "./network_security_config.xml"
    }
  }
  ```

### 3. Platform Configuration in Appwrite Console

**Important**: Make sure your Appwrite project is configured for the correct platform:

1. Go to your Appwrite Console
2. Navigate to Settings → Platforms
3. Add a new platform:
   - **Type**: Android
   - **Name**: iTalk Android
   - **Package Name**: `com.italk.mobile` (must match your app.json)

### 4. Debugging Tools Added

**Connection Test Component**: Added `AppwriteConnectionTest` component to help debug connection issues in built apps.

**Enhanced Logging**: Added detailed console logging in `appwrite.ts` to track configuration and connection status.

## Build Commands

### Clean Build (Recommended)
```bash
# Clear EAS cache and build
eas build --clear-cache -p android --profile preview
```

### Regular Build
```bash
eas build -p android --profile preview
```

## Testing Steps

1. **Build the APK**:
   ```bash
   eas build -p android --profile preview
   ```

2. **Install and Test**:
   - Install the APK on your device
   - Open the app
   - If you see the loading screen, tap "Test Appwrite Connection"
   - Check the connection status and configuration

3. **Check Logs**:
   - Use `adb logcat` to see console logs from the app
   - Look for Appwrite configuration and connection messages

## Common Issues & Solutions

### Issue: "Project ID is missing"
**Solution**: Verify environment variables are properly set in `eas.json`

### Issue: "Network request failed"
**Solution**: 
- Check network security configuration
- Verify Appwrite endpoint is accessible
- Ensure device has internet connection

### Issue: "Invalid project ID"
**Solution**: 
- Verify project ID in Appwrite console
- Check platform configuration in Appwrite
- Ensure bundle identifier matches

### Issue: "CORS errors"
**Solution**: 
- Add your domain to Appwrite platform settings
- Verify platform configuration is correct

## Verification Checklist

- [ ] Environment variables added to `eas.json`
- [ ] Network permissions added to `app.json`
- [ ] Network security config file created
- [ ] Appwrite platform configured with correct bundle ID
- [ ] Project ID and endpoint are correct
- [ ] Built with `--clear-cache` flag

## Additional Resources

- [EAS Build Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [Appwrite Platform Configuration](https://appwrite.io/docs/getting-started-for-android)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
