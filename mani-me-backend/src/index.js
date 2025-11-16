require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');

// Import route files (we will create these later)
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipment');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);

const PORT = process.env.PORT || 4000;

// Connect to database and start server
sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📱 Mobile devices can connect at http://192.168.0.138:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
