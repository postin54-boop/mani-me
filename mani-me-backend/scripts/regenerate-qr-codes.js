/**
 * Script to regenerate QR codes for existing parcels
 * This fixes the old URL (maniime.com) to the correct URL (www.manime.co.uk)
 * 
 * Run: node scripts/regenerate-qr-codes.js
 */

const mongoose = require('mongoose');
const QRCode = require('qrcode');
require('dotenv').config();

// Correct tracking URL
const TRACKING_BASE_URL = 'https://www.manime.co.uk/track';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or MONGO_URI environment variable is required');
  process.exit(1);
}

// Shipment schema (minimal for this script)
const shipmentSchema = new mongoose.Schema({
  tracking_number: String,
  parcel_id_short: String,
  qr_code_url: String,
  qr_code_data: String,
}, { collection: 'shipments', strict: false });

const Shipment = mongoose.model('Shipment', shipmentSchema);

/**
 * Generate QR code data URL
 */
async function generateQRCodeImage(trackingUrl) {
  try {
    const qrCodeUrl = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

async function regenerateQRCodes() {
  console.log('🔄 Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all shipments with QR codes
    const shipments = await Shipment.find({
      $or: [
        { qr_code_url: { $exists: true, $ne: null } },
        { tracking_number: { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`📦 Found ${shipments.length} shipments to update`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const shipment of shipments) {
      try {
        const trackingNumber = shipment.tracking_number || shipment.parcel_id_short;
        
        if (!trackingNumber) {
          console.log(`⏭️  Skipping shipment ${shipment._id} - no tracking number`);
          skipped++;
          continue;
        }
        
        // Generate new tracking URL
        const trackingUrl = `${TRACKING_BASE_URL}/${trackingNumber}`;
        
        // Generate new QR code
        const newQRCodeUrl = await generateQRCodeImage(trackingUrl);
        
        if (!newQRCodeUrl) {
          console.log(`❌ Failed to generate QR for ${trackingNumber}`);
          errors++;
          continue;
        }
        
        // Update the shipment
        await Shipment.updateOne(
          { _id: shipment._id },
          { 
            $set: { 
              qr_code_url: newQRCodeUrl,
              qr_code_data: trackingUrl
            } 
          }
        );
        
        updated++;
        console.log(`✅ Updated ${trackingNumber} (${updated}/${shipments.length})`);
        
      } catch (err) {
        console.error(`❌ Error updating shipment ${shipment._id}:`, err.message);
        errors++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${shipments.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
regenerateQRCodes();
