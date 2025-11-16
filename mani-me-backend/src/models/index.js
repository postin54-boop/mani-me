const { Sequelize } = require('sequelize');
const UserModel = require('./user');
const ShipmentModel = require('./shipment');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Create model objects
const User = UserModel(sequelize);
const Shipment = ShipmentModel(sequelize);

// Relationships
User.hasMany(Shipment, { foreignKey: 'user_id' });
Shipment.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Shipment };
