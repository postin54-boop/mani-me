require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db } = require('./firebase');

// Import route files
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipment');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const driverRoutes = require('./routes/driver');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Make Firestore available to routes
app.locals.db = db;

// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/driver', driverRoutes);

const PORT = process.env.PORT || 4000;

// Start server (no database sync needed with Firebase)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📱 Mobile devices can connect at http://192.168.0.138:${PORT}`);
  console.log(`🔥 Using Firebase Firestore database`);
});
