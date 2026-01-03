# Driver Workflows - UK vs Ghana

## Overview
Mani Me has two distinct driver types with separate workflows and responsibilities.

---

## UK Driver Workflow
**Location:** United Kingdom  
**Primary Role:** Parcel collection and warehouse delivery

### Responsibilities
1. **Pickup Parcels**
   - View assigned pickup jobs
   - Navigate to customer address
   - Collect parcels from sender
   - Scan parcel QR/barcode

2. **Payment Collection**
   - Confirm payment received (cash/card/online)
   - Record payment method
   - Issue receipt if needed

3. **Label Printing**
   - Print shipping labels for parcels
   - Attach labels to parcels
   - Verify parcel details

4. **Warehouse Delivery**
   - Transport collected parcels to warehouse
   - Check in parcels at warehouse
   - Hand over to warehouse staff
   - Update parcel status to "in_warehouse"

### App Features (UK Driver)
- **View UK Pickups** (`UKPickupsScreen.js`)
- **Scan Parcel** - Register pickup
- **Print Labels** - Generate/print shipping labels
- **Cash Reconciliation** - End-of-shift payment summary
- **Job Details** - Pickup address, time window, customer contact

### Backend Endpoints
- `GET /api/shipments/driver/:driverId?type=pickup` - Get assigned pickups
- `PUT /api/shipments/:id/pickup` - Confirm pickup complete
- `POST /api/shipments/:id/payment` - Record payment
- `POST /api/shipments/:id/warehouse-checkin` - Check in at warehouse

---

## Ghana Driver Workflow
**Location:** Ghana  
**Primary Role:** Last-mile delivery to recipients

### Responsibilities
1. **Collect Parcels from Warehouse**
   - View assigned deliveries
   - Pick up parcels from Ghana warehouse
   - Load into delivery vehicle

2. **Navigate to Recipients**
   - Follow delivery route
   - Use GPS navigation
   - Contact recipients if needed

3. **Deliver Parcels**
   - Find recipient at delivery address
   - Hand over parcel
   - Verify recipient identity

4. **Proof of Delivery (POD)**
   - Take photo of delivered parcel
   - Get recipient signature (optional)
   - Upload POD to system
   - Update status to "delivered"

### App Features (Ghana Driver)
- **View Ghana Deliveries** (`GhanaDeliveriesScreen.js`)
- **Scan Parcel** - Confirm delivery pickup from warehouse
- **Proof of Delivery** - Camera to capture delivery photo
- **Job Details** - Delivery address, recipient contact, notes
- **Chat with Recipient** (optional)

### Backend Endpoints
- `GET /api/shipments/driver/:driverId?type=delivery` - Get assigned deliveries
- `PUT /api/shipments/:id/deliver` - Confirm delivery complete
- `POST /api/shipments/:id/proof-of-delivery` - Upload POD photo

---

## Database Schema Updates Needed

### User Model (Driver fields)
```javascript
{
  fullName: String,
  email: String,
  phone: String,
  role: String, // "UK_DRIVER" | "GH_DRIVER" | "CUSTOMER" | "ADMIN"
  country: String, // "UK" | "Ghana"
  driver_type: String, // "pickup" | "delivery"
  vehicle_number: String,
  driver_license: String,
  is_verified: Boolean,
  is_active: Boolean,
  push_token: String
}
```

### Shipment Model (Driver assignments)
```javascript
{
  // ... existing fields
  pickup_driver_id: ObjectId, // UK driver assigned for pickup
  pickup_completed_at: Date,
  pickup_photo: String,
  
  delivery_driver_id: ObjectId, // Ghana driver assigned for delivery
  delivery_completed_at: Date,
  proof_of_delivery_photo: String,
  recipient_signature: String,
  
  payment_collected: Boolean,
  payment_method: String, // "cash" | "card" | "online"
  payment_amount: Number,
  
  warehouse_checked_in: Boolean,
  warehouse_checked_in_at: Date,
  warehouse_checked_in_by: ObjectId
}
```

---

## Navigation Structure

### UK Driver Bottom Tabs
1. **Home** - Dashboard with active pickups
2. **Pickups** - List of assigned pickup jobs (`UKPickupsScreen`)
3. **History** - Completed pickups
4. **More** - Settings, earnings, profile

### Ghana Driver Bottom Tabs
1. **Home** - Dashboard with active deliveries
2. **Deliveries** - List of assigned deliveries (`GhanaDeliveriesScreen`)
3. **History** - Completed deliveries
4. **More** - Settings, earnings, profile

---

## Status Flow Comparison

### UK Driver (Pickup Journey)
```
pending → assigned_uk_driver → en_route_pickup → picked_up → 
payment_confirmed → warehouse_checked_in
```

### Ghana Driver (Delivery Journey)
```
warehouse_checked_in → assigned_gh_driver → out_for_delivery → 
delivered (+ POD photo)
```

---

## Implementation Checklist

### Backend
- [ ] Add `role`, `driver_type`, `country` fields to User model
- [ ] Update authentication to return driver type
- [ ] Create separate endpoints for UK pickups vs Ghana deliveries
- [ ] Add payment collection endpoint
- [ ] Add warehouse check-in endpoint
- [ ] Add proof of delivery upload endpoint

### Driver App (Frontend)
- [ ] Update `AuthContext` to store full driver profile (role, type, country)
- [ ] Make `HomeScreen` fully role-aware (show different content for UK/GH)
- [ ] Create role-based navigation (different tabs for UK vs GH)
- [ ] Implement payment collection flow (UK drivers only)
- [ ] Implement warehouse check-in (UK drivers only)
- [ ] Implement proof of delivery with camera (Ghana drivers only)
- [ ] Add chat with recipient feature (Ghana drivers only)

### Admin Dashboard
- [ ] Show driver type/country in driver management
- [ ] Separate assignment interfaces for UK pickups vs Ghana deliveries
- [ ] Track payment reconciliation for UK drivers
- [ ] Monitor POD completion for Ghana drivers

---

## Key Differences Summary

| Feature | UK Driver | Ghana Driver |
|---------|-----------|--------------|
| **Main Action** | Pickup from sender | Deliver to recipient |
| **Payment** | Collect payment | No payment handling |
| **Photos** | Optional pickup photo | Required POD photo |
| **Labels** | Print shipping labels | No label printing |
| **Destination** | Warehouse | Customer address |
| **Cash Handling** | Yes (reconciliation) | No |
| **Warehouse** | Check in parcels | Pick up parcels |

