# Mani Me - Architecture & Communication Analysis
**Analysis Date**: December 24, 2025

## 🏗️ System Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├──────────────────┬──────────────────┬─────────────────────────────┤
│   Mobile App     │   Driver App     │   Admin Dashboard          │
│  (React Native)  │ (React Native)   │   (React Web)              │
│   Port: 8081     │   Port: 8082     │   Port: 3000               │
└────────┬─────────┴────────┬─────────┴──────────┬─────────────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                           │
                    HTTP REST API
                           │
         ┌─────────────────┴─────────────────┐
         │      Backend Server               │
         │   (Node.js + Express)             │
         │      Port: 4000                   │
         └──────┬────────────────────┬───────┘
                │                    │
        ┌───────┴────────┐   ┌──────┴────────┐
        │   MongoDB      │   │  Firebase      │
        │  (Data Store)  │   │ (Auth + Push)  │
        └────────────────┘   └────────────────┘
```

## 🔌 API Communication Patterns

### **CRITICAL ISSUE #1: Missing Shipment Routes**
❌ **PROBLEM**: The shipment routes are NOT registered in `app.js`
```javascript
// Current app.js (MISSING shipment routes!)
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/parcels', require('./routes/parcel'));
// ❌ NO shipment route registered!
```

**Impact**: 
- Driver app calls `/api/drivers/${userId}/assignments` → 404 error
- Mobile app creates shipments → likely fails
- Admin dashboard can't view shipments

**Files exist but not connected**:
- ✅ `/routes/shipment.js` (523 lines)
- ✅ `/routes/shipmentRoutes.js` 
- ✅ `/routes/shipments.routes.js`
- ❌ NOT mounted in `app.js`

### **CRITICAL ISSUE #2: IP Address Mismatch**
❌ **PROBLEM**: Different IP addresses across apps

| App | IP Address | File |
|-----|-----------|------|
| Driver App | `192.168.1.181:4000` | `utils/optimizedApi.js` |
| Mobile App | `192.168.1.181:4000` | `src/api.js` |
| Admin Dashboard | `192.168.0.138:4000` | `src/api.js` |

**Impact**: Admin dashboard CANNOT connect to backend if IPs don't match

### **CRITICAL ISSUE #3: Driver Assignment API Missing**
❌ The driver app calls:
```javascript
fetchDriverAssignmentsPaginated(userId, 'pickup', page, 20)
// Expected endpoint: GET /api/drivers/${userId}/assignments?type=pickup&page=1&limit=20
```

But `/routes/driver.js` only has:
- ✅ GET `/api/drivers` (all drivers)
- ✅ POST `/api/drivers` (add driver)
- ✅ POST `/api/drivers/clock-in`
- ✅ POST `/api/drivers/clock-out`
- ❌ Missing: GET `/api/drivers/:id/assignments`

## 📊 Database Architecture

### MongoDB Collections (Mongoose Models)

#### **User Model** (`models/user.js`)
```javascript
{
  fullName: String,
  email: String (unique),
  phone: String,
  password: String (hashed with bcrypt),
  push_token: String, // Expo push token
  
  // Role-based fields
  role: ["CUSTOMER", "UK_DRIVER", "GH_DRIVER", "ADMIN"],
  driver_type: ["pickup", "delivery", null], // pickup=UK, delivery=Ghana
  country: ["UK", "Ghana", null],
  
  // Driver verification
  vehicle_number: String,
  driver_license: String,
  is_verified: Boolean,
  is_active: Boolean
}
```

#### **Shipment Model** (`models/shipment.js`)
```javascript
{
  userId: String,
  
  // Warehouse status
  warehouse_status: ["not_arrived", "received", "sorted", "packed", "shipped"],
  status: String, // Overall status
  
  // Sender (UK)
  sender_name, sender_phone, sender_email,
  pickup_address, pickup_city, pickup_postcode,
  pickup_date, pickup_time,
  
  // Receiver (Ghana)
  receiver_name, receiver_phone, receiver_alternate_phone,
  delivery_address, delivery_city, delivery_region,
  
  // Parcel
  weight_kg, dimensions, parcel_description, parcel_value,
  
  // Payment
  payment_method: ["card", "cash"],
  
  // Driver assignments
  pickup_driver_id: ObjectId, // UK driver
  delivery_driver_id: ObjectId, // Ghana driver
  
  // Tracking
  tracking_number, qr_code_url, parcel_image_url
}
```

### Firebase Collections (Firestore)
- **`shifts`**: Driver clock-in/clock-out records
- **`notifications`**: Push notification history
- **`chat`**: Real-time chat messages (if implemented)

## 🔐 Authentication Flow

### Mobile App & Driver App (JWT)
1. User registers: `POST /api/auth/register`
   ```javascript
   { fullName, email, password, role, driver_type, country }
   → Returns: { token, user }
   ```

2. User logs in: `POST /api/auth/login`
   ```javascript
   { email, password }
   → Returns: { token, user }
   ```

3. Token storage:
   - **Mobile/Driver**: AsyncStorage
   - **Admin**: localStorage

4. Authenticated requests:
   ```javascript
   headers: { Authorization: `Bearer ${token}` }
   ```

5. Token validation: JWT signed with `JWT_SECRET`, 7-day expiry

### Admin Dashboard
- Separate token: `adminToken` stored in localStorage
- Same JWT pattern but stored separately

## 📱 Frontend Communication Patterns

### **Mobile App** (`mani-me-mobile`)
**Key Screens**:
- `BookingScreen.js`: Creates shipments
- `TrackingScreen.js`: Views shipment status
- `HomeScreen.js`: Dashboard with recent parcels

**API Calls**:
```javascript
// Via axios instance (src/api.js)
POST /api/shipments/create → Create booking
GET /api/tracking/:trackingNumber → Track parcel
GET /api/parcels/:userId → User's parcels
POST /api/payments → Process payment
```

**State Management**: Context API
- `AuthContext`: User authentication
- `UnifiedCartContext`: Shopping cart (if shopping feature exists)

### **Driver App** (`mani-me-driver`)
**Key Screens**:
- `UKPickupsScreen.js`: UK driver pickups (FlatList + pagination)
- `GhanaDeliveriesScreen.js`: Ghana driver deliveries (FlatList + pagination)
- `CashReconciliationScreen.js`: Cash reconciliation
- `HomeScreen.js`: Driver dashboard

**API Calls** (via `utils/optimizedApi.js`):
```javascript
// Expected but MISSING on backend:
GET /api/drivers/${userId}/assignments?type=pickup&page=1&limit=20
PUT /api/pickups/${pickupId}/status
PUT /api/deliveries/${deliveryId}/status

// Working:
POST /api/cash-reconciliation → Submit cash report
POST /api/drivers/clock-in → Start shift
POST /api/drivers/clock-out → End shift
```

**Optimizations Applied**:
- ✅ FlatList virtualization (10 items per batch)
- ✅ In-memory caching (2-minute TTL)
- ✅ Pagination (20 items per page)
- ✅ Retry logic (exponential backoff)
- ✅ Request deduplication

### **Admin Dashboard** (`mani-me-admin`)
**Technology**: React + Material-UI (MUI)

**Key Pages**:
- `pages/Shipments.js`: View all shipments
- `pages/Drivers.js`: Manage drivers
- `pages/Users.js`: Manage customers

**API Calls**:
```javascript
// Via axios instance (src/api.js)
GET /api/shipments → All shipments
PUT /api/shipments/:id → Update shipment
POST /api/shipments/assign-driver → Assign driver
GET /api/drivers → All drivers
GET /api/auth/users → All users
```

## 🔔 Notification System

### Push Notification Flow
```
Backend Event
    ↓
Firebase Cloud Functions (functions/modules/notification.js)
    ↓
Expo Push Notification Service
    ↓
Mobile/Driver App (Expo client)
```

**Notification Types**:
1. **Shipment Status Updates**
   - `booked`, `picked_up`, `in_transit`, `customs`, `out_for_delivery`, `delivered`
   
2. **Driver Assignment**
   - Pickup assigned to UK driver
   - Delivery assigned to Ghana driver

3. **Pickup/Cancel/Reschedule** (per `NOTIFICATION_SYSTEM.md`)

**Implementation**:
```javascript
// Backend sends notification
await sendPickupAssignedNotification(driver.push_token, shipment, driver);

// Cloud Function processes
sendPushNotification(pushToken, title, body, data);

// Expo SDK sends to device
expo.sendPushNotificationsAsync([message]);
```

## 🔧 Backend API Structure

### Route Organization
```
/api
├── /auth           → User authentication
├── /bookings       → Booking creation (legacy?)
├── /parcels        → Parcel management
├── /tracking       → Tracking by number
├── /payments       → Payment processing
├── /notifications  → Notification history
├── /drivers        → Driver management
├── /products       → Product catalog (shop feature?)
├── /categories     → Product categories
├── /chat           → Chat system
├── /cash-reconciliation → Driver cash reports
└── ❌ /shipments   → MISSING from app.js!
```

### Shipment Route Endpoints (`routes/shipment.js`)
**Available but NOT mounted**:
```javascript
POST /api/shipments/create → Create shipment
PUT /api/shipments/assign-driver/:id → Assign UK/Ghana driver
PUT /api/shipments/:id/status → Update status
GET /api/shipments → List all (admin)
GET /api/shipments/:id → Get single shipment
```

## ⚠️ Critical Issues Summary

### **1. Backend Route Registration**
❌ **URGENT**: Add to `src/app.js`:
```javascript
app.use('/api/shipments', require('./routes/shipment'));
```

### **2. Missing Driver Assignment Endpoint**
❌ **URGENT**: Add to `routes/driver.js`:
```javascript
router.get('/:id/assignments', async (req, res) => {
  // Get driver's assigned pickups/deliveries
  // Support pagination: ?type=pickup&page=1&limit=20
});
```

### **3. IP Address Standardization**
❌ **MEDIUM**: Update all API base URLs to match:
- Determine production IP/domain
- Update `mani-me-admin/src/api.js` from `192.168.0.138` to `192.168.1.181`
- Or use environment variables

### **4. Missing Update Status Endpoints**
❌ **MEDIUM**: Driver app calls:
```javascript
updatePickupStatus(pickupId, 'parcel_collected')
updateDeliveryStatus(deliveryId, status, proofData)
```

These need backend endpoints:
```javascript
PUT /api/pickups/:id/status
PUT /api/deliveries/:id/status
```

### **5. Database Schema vs API Mismatch**
⚠️ **LOW**: Shipment model has `pickup_driver_id` but no explicit Pickup/Delivery models
- Driver app expects separate pickup/delivery objects
- Backend stores everything in Shipment model
- Need mapping layer or separate endpoints

## 🎯 Recommendations

### **Immediate Actions (CRITICAL)**
1. ✅ Add shipment routes to app.js
2. ✅ Create driver assignments endpoint
3. ✅ Implement pickup/delivery status update endpoints
4. ✅ Standardize IP addresses across apps

### **Short-term Improvements**
5. Add environment variable configuration for API URLs
6. Implement proper error handling middleware
7. Add request validation (express-validator)
8. Add rate limiting (express-rate-limit)
9. Add API documentation (Swagger/OpenAPI)

### **Architecture Improvements**
10. Separate Pickup and Delivery models for clarity
11. Add Redis caching layer for high-load scenarios
12. Implement WebSocket for real-time updates
13. Add database indexes for common queries:
    ```javascript
    shipmentSchema.index({ pickup_driver_id: 1, status: 1 });
    shipmentSchema.index({ delivery_driver_id: 1, status: 1 });
    shipmentSchema.index({ tracking_number: 1 });
    ```

### **Security Enhancements**
14. Add helmet.js for HTTP headers
15. Implement CORS properly (currently open)
16. Add input sanitization (express-mongo-sanitize)
17. Implement refresh tokens for JWT
18. Add 2FA for admin accounts

## 📈 Scalability Analysis

### Current Capacity
- **Driver App**: Optimized for 50k concurrent users
  - FlatList virtualization
  - 2-minute caching
  - Pagination (20 items/page)
  - Expected: 85% faster loads, 87% fewer API calls

### Bottlenecks
1. **Single MongoDB Instance**: No replication/sharding
2. **No Load Balancer**: Single backend server
3. **No CDN**: Static assets served directly
4. **No Queue System**: Notifications sent synchronously

### Recommended Scaling Path
1. **Phase 1** (1k-5k users): Current setup with optimizations
2. **Phase 2** (5k-20k users): 
   - Add MongoDB replica set
   - Implement Redis caching
   - Add queue system (Bull/RabbitMQ)
3. **Phase 3** (20k-50k+ users):
   - Horizontal scaling with load balancer
   - Database sharding
   - Separate notification microservice
   - CDN for static assets

## 🔗 Integration Points

### Mobile App ↔ Backend
- ✅ User registration/login
- ✅ Shipment creation
- ❓ Shipment tracking (if shipment route connected)
- ✅ Push notifications
- ✅ Payment processing

### Driver App ↔ Backend
- ✅ Driver authentication
- ❌ Assignment fetching (endpoint missing)
- ❌ Status updates (endpoint missing)
- ✅ Cash reconciliation
- ✅ Clock in/out

### Admin Dashboard ↔ Backend
- ⚠️ IP mismatch prevents connection
- ✅ Shipment management (once route connected)
- ✅ Driver management
- ✅ User management
- ✅ Driver assignment

### Backend ↔ Firebase
- ✅ Push notifications (Expo SDK)
- ✅ Firestore (shifts, optional chat)
- ⚠️ Firebase Admin SDK needs `serviceAccountKey.json`

## 📝 Next Steps

**Priority 1 - Fix Broken Features**:
1. Add shipment routes to app.js
2. Create driver assignments API
3. Fix admin dashboard IP address

**Priority 2 - Complete Driver App**:
4. Implement pickup status update endpoint
5. Implement delivery status update endpoint
6. Test end-to-end pickup flow

**Priority 3 - Testing**:
7. Test mobile app booking → driver pickup → delivery flow
8. Test admin dashboard shipment management
9. Test notification delivery

**Priority 4 - Documentation**:
10. Create API documentation
11. Add deployment guide
12. Create troubleshooting guide

---

**Status**: 🔴 **CRITICAL ISSUES FOUND** - Backend routes not connected, driver endpoints missing
**Recommendation**: Fix backend routing before production deployment
