# ⚠️ ACTION REQUIRED: Token Refresh Needed

## Issue
After recent security updates, admin tokens need to be refreshed.

## Solution
**Please logout and login again in the admin dashboard**

### Steps:
1. Click the profile icon (top right)
2. Click "Logout"
3. Login again with your admin credentials

### Why?
- Token structure was updated for security
- New tokens include proper `user_id` field
- Old tokens are incompatible with new authentication flow

### Technical Details
**Changes made:**
- Standardized token storage to `adminToken`
- Added `user_id` to JWT payload
- Updated `verifyAdmin` middleware to extract `req.userId`
- Reduced token expiry to 2 hours (from 24 hours)
- Added login rate limiting (3 attempts per 30 minutes)

After logging in again, all pages (including UK Drivers, Ghana Drivers, Orders, Users) should work correctly.
