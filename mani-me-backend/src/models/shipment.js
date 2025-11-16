const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Shipment', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    // Sender Details (UK-based)
    sender_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sender_phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sender_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Pickup Address (UK)
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    pickup_city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pickup_postcode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pickup_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    pickup_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Receiver Details (Ghana-based)
    receiver_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    receiver_phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    receiver_alternate_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Delivery Address (Ghana)
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    delivery_city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    delivery_region: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Parcel Details
    weight_kg: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1
    },
    dimensions: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Format: LxWxH in cm'
    },
    parcel_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parcel_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Declared value in GBP'
    },
    // Payment & Pricing
    payment_method: {
      type: DataTypes.ENUM('card', 'cash'),
      defaultValue: 'card'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending'
    },
    total_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    // Tracking & Status
    tracking_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('booked', 'picked_up', 'in_transit', 'customs', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'booked'
    },
    // Timestamps for each status
    booked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    picked_up_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    in_transit_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customs_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    out_for_delivery_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Additional Info
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'shipments',
    underscored: true,
    hooks: {
      beforeCreate: async (shipment) => {
        // Generate tracking number if not provided
        if (!shipment.tracking_number) {
          shipment.tracking_number = 'MM' + Date.now() + Math.floor(Math.random() * 1000);
        }
        // Set booked timestamp
        if (shipment.status === 'booked' && !shipment.booked_at) {
          shipment.booked_at = new Date();
        }
      }
    }
  });
};
