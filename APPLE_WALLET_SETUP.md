# Apple Wallet Integration Guide

## Overview
This guide explains how to set up Apple Wallet passes for Mani Me shipment tracking.

## Prerequisites
1. **Apple Developer Account** (activated) ✅
2. **Pass Type ID** registered in Apple Developer Portal
3. **Pass Signing Certificate** (.p12 file)

## Step 1: Create Pass Type ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **Pass Type IDs**
5. Enter:
   - Description: `Mani Me Shipment Tracking`
   - Identifier: `pass.com.manime.shipment`
6. Click **Continue** → **Register**

## Step 2: Create Pass Signing Certificate

1. In Apple Developer Portal, go to **Certificates**
2. Click **+** to create a new certificate
3. Select **Pass Type ID Certificate**
4. Select your Pass Type ID (`pass.com.manime.shipment`)
5. Follow instructions to create a **Certificate Signing Request (CSR)** using Keychain Access
6. Upload CSR and download the certificate
7. Double-click to install in Keychain Access
8. Export as `.p12` file with a password

## Step 3: Set Environment Variables

Add these to your backend `.env` file:

```env
APPLE_PASS_TYPE_ID=pass.com.manime.shipment
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_PASS_CERTIFICATE_PATH=/path/to/certificate.p12
APPLE_PASS_CERTIFICATE_PASSWORD=your_password
```

## Step 4: Add Pass Assets

Create these images in `mani-me-backend/assets/wallet/`:

| File | Size | Description |
|------|------|-------------|
| `icon.png` | 29x29 | Small icon |
| `icon@2x.png` | 58x58 | Retina icon |
| `icon@3x.png` | 87x87 | Super retina icon |
| `logo.png` | 160x50 | Logo displayed on pass |
| `logo@2x.png` | 320x100 | Retina logo |
| `strip.png` | 375x123 | Background strip (optional) |
| `strip@2x.png` | 750x246 | Retina strip |

Use your Mani Me branding:
- Navy Blue: `#0B1A33`
- Sky Blue: `#83C5FA`
- White text

## Step 5: Install Pass Signing Library

```bash
cd mani-me-backend
npm install passkit-generator
```

## Step 6: Update Wallet Route for Production

Update `src/routes/wallet.js` to use passkit-generator:

```javascript
const { PKPass } = require('passkit-generator');

// In the route handler:
const pass = new PKPass({
  model: './assets/wallet/pass.pass',
  certificates: {
    wwdr: './certs/wwdr.pem',
    signerCert: './certs/signerCert.pem',
    signerKey: './certs/signerKey.pem',
    signerKeyPassphrase: process.env.APPLE_PASS_CERTIFICATE_PASSWORD,
  },
});

pass.serialNumber = shipment.tracking_number;
// ... set other fields

const buffer = await pass.generate();
res.set({
  'Content-Type': 'application/vnd.apple.pkpass',
  'Content-Disposition': `attachment; filename=${shipment.tracking_number}.pkpass`,
});
res.send(buffer);
```

## Step 7: Enable Push Updates (Optional)

To update passes when shipment status changes:

1. Register for Apple Push Notification service (APNs)
2. Store device tokens when users add passes
3. Send push notifications when status changes

## Testing

1. Build the iOS app with Xcode
2. Navigate to a shipment detail screen
3. Tap "Add to Apple Wallet"
4. Pass should appear in your Wallet app

## Troubleshooting

### Pass won't add to Wallet
- Check certificate is valid and not expired
- Verify Pass Type ID matches exactly
- Ensure all required images are present
- Check manifest.json has correct SHA1 hashes

### Pass shows "This pass is not valid"
- Certificate may be revoked or expired
- Team ID doesn't match certificate
- Pass Type ID not registered

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/pass/:shipmentId` | GET | Generate and download pass |
| `/api/wallet/pass/:serialNumber/status` | GET | Get pass status for updates |

## Resources

- [Apple Wallet Developer Guide](https://developer.apple.com/wallet/)
- [PassKit Package Format Reference](https://developer.apple.com/library/archive/documentation/UserExperience/Reference/PassKit_Bundle/Chapters/Introduction.html)
- [passkit-generator npm](https://www.npmjs.com/package/passkit-generator)
