# Copilot Instructions for Mani Me Codebase

## Overview
Mani Me is a **UK-to-Ghana parcel delivery platform** with a multi-repo monorepo structure:
- **mani-me-backend**: Node.js/Express backend (MongoDB for data, Firebase for auth/push)
- **mani-me-admin**: React/MUI admin dashboard
- **mani-me-mobile**: React Native (Expo) customer app
- **mani-me-driver**: React Native (Expo) driver app (UK pickups & Ghana deliveries)
- **functions**: Firebase Cloud Functions (notifications, QR codes)

## Architecture & Data Flow

### Backend (mani-me-backend)
- **3-layer architecture**: Routes → Controllers → Services → Models
- **MongoDB models** in `src/models/` use Mongoose (see `shipment.js`, `user.js`)
- **Firebase Admin SDK** for auth and push notifications (initialized in `src/firebase.js`)
- **API structure**: `src/routes/` define endpoints, `src/controllers/` handle requests, `src/services/` contain business logic
- **Example flow**: POST `/api/shipments` → `shipment.js` (route) → `shipmentController.js` → `shipmentService.js` → `Shipment` (model)

### Mobile & Driver Apps (React Native)
- **Theme hook pattern**: Import `useThemeColors()` from `constants/theme.js` for automatic dark mode support
  ```javascript
  const { colors, isDark } = useThemeColors();
  ```
- **Context-based state**: `AuthContext.js` (driver auth + UK/Ghana type), `UnifiedCartContext.js` (cart management)
- **API calls**: Use `API_BASE_URL` from `utils/config.js` (currently `http://192.168.0.138:4000`)
- **Driver types**: UK drivers handle pickups, Ghana drivers handle deliveries (check `driverType` in AuthContext)

### Cloud Functions (functions/)
- **Modular structure**: `modules/notification.js` (Expo push), `modules/parcel.js`, `modules/qrcode.js`
- **Expo push notifications**: Use `expo-server-sdk` to send notifications (see `functions/modules/notification.js`)
- **Trigger pattern**: Backend calls Cloud Functions or Firestore triggers invoke them
- **Run locally**: `npm run serve` (emulator), deploy with `npm run deploy`

### Key Integrations
- **Notifications**: Backend → `functions/modules/notification.js` → Expo Push Tokens (see `NOTIFICATION_SYSTEM.md`)
- **QR Codes**: Cloud Function `generateQRCode` creates QR for parcel tracking
- **Driver Assignment**: Shipments have `pickup_driver_id` (UK) and `delivery_driver_id` (Ghana) refs to User model

## Developer Workflows

### Backend Development
```bash
cd mani-me-backend
npm start              # Start dev server on port 4000
npm run dev            # Start with nodemon (auto-reload)
```
- **Database migrations**: Stored in `migrations/`, run with custom migration script (check `package.json`)
- **Environment**: Create `.env` with `MONGO_URI`, `JWT_SECRET`, Firebase credentials

### Mobile/Driver App Development
```bash
cd mani-me-mobile      # or mani-me-driver
npm start              # or expo start
```
- **Test on device**: Use Expo Go app, scan QR code
- **API config**: Update `utils/config.js` with your machine's IP for local testing
- **Branding**: Follow `BRAND_GUIDE.md` - navy blue (#0B1A33), sky blue (#83C5FA), 8px spacing grid

### Cloud Functions Development
```bash
cd functions
npm run serve          # Start Firebase emulators
firebase deploy --only functions  # Deploy to production
```

### Admin Dashboard
```bash
cd mani-me-admin
npm start              # Dev server (port 3000)
npm run build          # Production build → build/ folder
```

## Critical Conventions & Patterns

### MongoDB Schema Patterns
- **ObjectId references**: Use `mongoose.Schema.Types.ObjectId` with `ref` for relationships
  ```javascript
  pickup_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ```
- **Shipment statuses**: `pending`, `booked`, `picked_up`, `in_transit`, `customs`, `out_for_delivery`, `delivered`
- **Warehouse statuses**: `not_arrived`, `received`, `sorted`, `packed`, `shipped`

### React Native UI Patterns
- **Always use theme hook**: `const { colors, isDark } = useThemeColors()` for dark mode
- **Status badges**: Use translucent backgrounds (e.g., `#10B98110` for success)
- **Card pattern**:
  ```javascript
  <View style={{
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  }}>
  ```
- **Icon library**: Use `Ionicons` from `@expo/vector-icons` throughout

### Backend Error Handling
- **Error middleware**: `middleware/errorHandler.js` catches all errors
- **Service layer throws**: Controllers wrap service calls in try/catch

### Notification Flow
1. Backend triggers notification (e.g., shipment status change)
2. Calls `functions/modules/notification.js` → `sendShipmentStatusNotification()`
3. Uses Expo push token stored in user/driver document
4. See `NOTIFICATION_SYSTEM.md` for complete pickup/cancel/reschedule flows

## Key Files to Reference

### When building backend features:
- `mani-me-backend/src/routes/shipment.js` - Complete CRUD example with driver assignment
- `mani-me-backend/src/models/shipment.js` - Full shipment schema (69+ fields)
- `functions/modules/notification.js` - Notification templates and patterns

### When building mobile features:
- `mani-me-mobile/screens/BookingScreen.js` - Multi-step form pattern with theme
- `mani-me-driver/screens/HomeScreen.js` - Driver dashboard with role-based UI
- `constants/theme.js` - Dark mode implementation, spacing constants

### When adding notifications:
- `NOTIFICATION_SYSTEM.md` - Complete guide for pickup/cancel/reschedule flows
- `functions/modules/notification.js` - Push notification utilities

## Common Tasks

### Add new backend API endpoint
1. Create service function in `src/services/[domain]Service.js`
2. Create controller in `src/controllers/[domain]Controller.js`
3. Add route in `src/routes/[domain].js` or create new route file
4. Register route in `src/app.js`: `app.use('/api/[resource]', require('./routes/[domain]'))`

### Add new screen to mobile app
1. Create screen file in `screens/[ScreenName].js`
2. Import `useThemeColors()` for theme consistency
3. Add route to `navigation/AppNavigator.js` (mobile) or `navigation/DriverStack.js` (driver)
4. Follow card/button patterns from `BRAND_GUIDE.md`

### Update shipment status & notify
1. Update shipment in backend service
2. Call `notificationService.sendStatusUpdate()` or Cloud Function
3. See `functions/modules/notification.js` for status → message mapping

## Authentication & API Patterns

### JWT Authentication Flow
- **Registration/Login**: `POST /api/auth/register` or `/api/auth/login` returns JWT token
- **Token format**: JWT signed with `JWT_SECRET`, 7-day expiry
- **Token payload**: `{ user_id: user._id }`, created with `jsonwebtoken` library
- **Password**: Hashed with `bcryptjs` (10 rounds)
- **Example response**:
  ```json
  { "token": "eyJhbGc...", "user": { "id": "...", "name": "...", "email": "..." } }
  ```

### API Request Pattern (Mobile Apps)
```javascript
// src/api.js - axios instance
const api = axios.create({
  baseURL: "http://192.168.0.138:4000/api"
});

// For authenticated requests, add header:
headers: { Authorization: `Bearer ${token}` }
```

### Push Token Management
- **Update endpoint**: `POST /api/auth/update-push-token`
- Stores Expo push token in user/driver document for notifications
- Used by `functions/modules/notification.js` for push notifications

## Testing & Quality

### Test Structure
- **Location**: `mani-me-backend/src/tests/*.test.js`
- **Test files**: `authService.test.js`, `shipmentService.test.js`, `notificationService.test.js`, etc.
- **Current status**: Placeholder tests (not fully implemented)
- **Framework**: Appears to use Jest (check `package.json` for test script)

### Error Handling Pattern
- **Central handler**: `middleware/errorHandler.js` catches all errors
- **Returns**: `{ message: err.message }` with 500 status
- **Service pattern**: Services throw errors, controllers catch and pass to error middleware

## Environment & Secrets

### Backend Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/mani-me  # MongoDB connection string
JWT_SECRET=your-secret-key-change-this         # JWT signing key
PORT=4000                                      # Server port (default: 4000)
FIREBASE_PROJECT_ID=mani-me-demo              # Optional: Firebase project ID for demo mode
```

### Firebase Setup
- **Service account**: Place `serviceAccountKey.json` in `mani-me-backend/`
- **Fallback mode**: If no service account, uses `FIREBASE_PROJECT_ID` from env
- **Initialization**: `src/firebase.js` exports `{ admin, db }` (Firestore)

### Mobile App Configuration
- **API Base URL**: Hardcoded in `mani-me-mobile/src/api.js` and `utils/config.js`
- **Local dev**: Update IP address to your machine's network IP (e.g., `192.168.0.138:4000`)
- **DO NOT COMMIT**: `.env`, `serviceAccountKey.json`, `.expo/` directories

## Database Migrations
- **Location**: `mani-me-backend/migrations/`
- **Status**: Migration files exist but no `npm run migrate` script configured
- **Pattern**: Sequelize-style migrations (see `20251208_add_pickup_and_delivery_driver_to_shipments.js`)
- **Note**: Currently using Mongoose models directly without formal migration system

## Deployment Notes
- **Backend**: No CI/CD configured, manual deployment
- **Mobile apps**: Expo build system (`expo build`, `eas build` for managed workflow)
- **Cloud Functions**: Deploy with `npm run deploy` in `functions/` directory
- **Admin**: Static build → `mani-me-admin/build/` folder (host on any static server)

---
**For AI agents:**
- **Driver types matter**: UK drivers = pickups, Ghana drivers = deliveries
- **Always check existing patterns**: Search `src/routes/` or `screens/` for similar implementations before creating new ones
- **Theme is mandatory**: Never hardcode colors in mobile apps, use `useThemeColors()`
- **MongoDB != Firebase**: MongoDB for data, Firebase for auth + push only
- **JWT tokens**: 7-day expiry, include in `Authorization: Bearer {token}` header for authenticated requests
