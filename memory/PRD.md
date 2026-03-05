# ClinicConnect - Healthcare Booking Platform PRD

## Project Overview
A comprehensive healthcare booking platform with:
- **React Web App**: Admin dashboard only
- **React Native Mobile App**: Patient and Doctor roles (Expo)
- **FastAPI Backend**: Shared backend with MongoDB

## Date
- Initial Build: February 28, 2026
- Major Refactor: February 28, 2026 (Mobile App + Admin-Only Web)

## User Personas
1. **Patient** (Mobile) - Books appointments, manages family members, consults doctors
2. **Doctor** (Mobile) - Manages appointments, provides consultations, builds profile
3. **Admin** (Web) - Oversees platform, verifies doctors, manages content
4. **Clinic** - (Planned for future)

## Core Requirements (Static)
- Multi-role authentication (Patient, Doctor, Admin)
- Doctor discovery with search and filters
- Appointment booking (In-person & Telehealth)
- Real-time chat per appointment
- Video consultation via Jitsi
- Family members management (max 4)
- Blog system
- Ads module
- Admin dashboard with analytics
- Notification system
- GDPR-ready privacy controls
- Razorpay payment integration (Mock mode ready)

## What's Been Implemented

### Mobile App (React Native/Expo) - `/app/mobile/`
#### Patient Screens
- [x] Login/Register screens with animations
- [x] Patient home dashboard
- [x] Doctor discovery with filters
- [x] Doctor profile view
- [x] Multi-step booking with Razorpay payment
- [x] Appointments list and detail
- [x] Chat screen
- [x] Video call screen (Jitsi)
- [x] Review/rating submission
- [x] Family members management
- [x] Profile settings

#### Doctor Screens
- [x] Doctor home dashboard with stats
- [x] Appointments management (confirm/complete)
- [x] Schedule management (weekly hours, block dates)
- [x] Profile settings with specialties

#### Shared Components
- [x] Reusable UI components (Card, Badge, Button)
- [x] Auth context with token management
- [x] API service layer

### Backend (FastAPI) - `/app/backend/`
- [x] JWT-based authentication
- [x] User registration (Patient/Doctor)
- [x] Doctor profile CRUD
- [x] Appointment CRUD with status management
- [x] Razorpay payment integration (MOCK MODE)
- [x] Reviews with ratings (1-5 stars)
- [x] Notifications system
- [x] Chat messages per appointment
- [x] Doctor availability/schedule

### Web App (React) - `/app/frontend/`
- [x] Landing page
- [x] Admin dashboard (to be Admin-only)
- Note: Still contains Patient/Doctor UI - pending refactor

## Technology Stack
- **Mobile**: React Native (Expo), React Navigation, Axios
- **Web**: React 18, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend**: FastAPI, MongoDB (Motor driver)
- **Auth**: JWT (python-jose)
- **Payments**: Razorpay (MOCK mode), Stripe (backup)
- **Video**: Jitsi Meet

## Demo Accounts
- Patient: patient@demo.com / patient123
- Doctor: doctor@demo.com / doctor123 (or sarah.johnson@clinic.com)
- Admin: admin@demo.com / admin123

## Razorpay Payment Configuration
Currently in MOCK mode. To enable real payments:
1. Get Razorpay API keys from https://dashboard.razorpay.com
2. Update `/app/backend/.env`:
   - `RAZORPAY_KEY_ID=rzp_live_yourkey`
   - `RAZORPAY_KEY_SECRET=yoursecret`
3. Restart backend: `sudo supervisorctl restart backend`

## Prioritized Backlog

### P0 (Critical - Done in this session)
- [x] Mobile app scaffolding complete
- [x] Razorpay payment integration (MOCK mode)
- [x] Doctor screens implementation
- [x] Patient screens implementation
- [x] Backend API fixes for MongoDB ObjectId

### P1 (High Priority - Upcoming)
- [ ] Refactor web app to Admin-only dashboard
- [ ] Test mobile app on device/emulator
- [ ] Add real Razorpay keys for live payments
- [ ] Push notifications (FCM)

### P2 (Medium Priority)
- [ ] Real-time chat with WebSockets
- [ ] Google Calendar integration for doctors
- [ ] Email notifications
- [ ] Prescription uploads

### P3 (Low Priority)
- [ ] Multi-language support
- [ ] Clinic role implementation
- [ ] Analytics dashboard improvements

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/doctors/*` - Doctor management & availability
- `/api/patients/*` - Patient management
- `/api/appointments/*` - Booking system
- `/api/family-members/*` - Family management
- `/api/notifications/*` - Notifications
- `/api/reviews/*` - Reviews with ratings
- `/api/payments/razorpay/*` - Razorpay payments
- `/api/blog/*` - Blog system
- `/api/ads/*` - Ads management
- `/api/admin/*` - Admin operations

## Test Results
- Backend API tests: 16/16 passed (100%)
- Test file: `/app/backend/tests/test_healthcare_api.py`
- Report: `/app/test_reports/iteration_2.json`

## Build APK Instructions
See `/app/mobile/BUILD_GUIDE.md` for complete instructions.

**Quick build:**
```bash
cd /app/mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Live URLs
- Web App: https://docpatient-staging.preview.emergentagent.com
- API: https://docpatient-staging.preview.emergentagent.com/api
