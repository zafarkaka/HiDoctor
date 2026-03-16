# ClinicConnect Mobile App - Build & Deployment Guide

## Quick Start - Building APK

### Option 1: EAS Build (Recommended - Cloud Build)

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo account:**
   ```bash
   cd /app/mobile
   eas login
   ```
   (Create free account at https://expo.dev if needed)

3. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```
   
4. **Download APK** from the link provided after build completes (~10-15 min)

### Option 2: Local Build (Requires Android SDK)

1. **Generate native project:**
   ```bash
   cd /app/mobile
   npx expo prebuild --platform android
   ```

2. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **APK location:** `android/app/build/outputs/apk/release/app-release.apk`

---

## Production Configuration

### 1. Update API URL
Edit `/app/mobile/src/utils/constants.js`:
```javascript
export const API_URL = 'https://your-production-domain.com';
```

Or set via environment variable:
```bash
EXPO_PUBLIC_API_URL=https://your-domain.com eas build --platform android
```

### 2. Razorpay Configuration
Update `/app/backend/.env` with real keys:
```env
RAZORPAY_KEY_ID=rzp_live_yourkey
RAZORPAY_KEY_SECRET=yoursecret
```

### 3. App Store Submission
For Google Play Store, use production profile:
```bash
eas build --platform android --profile production
```

---

## Test Accounts
- Patient: patient@demo.com / patient123
- Doctor: doctor@demo.com / doctor123
- Admin: admin@demo.com / admin123

---

## Mobile App Features
- Patient: Find doctors, book appointments, video calls, chat, reviews
- Doctor: Manage appointments, set schedule, view patients

## Web App (Admin)
- URL: https://docpatient-staging.preview.emergentagent.com
- Admin dashboard for managing platform
