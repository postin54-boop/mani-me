"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("shipments", "pickup_driver_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("shipments", "delivery_driver_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("shipments", "pickup_driver_id");
    await queryInterface.removeColumn("shipments", "delivery_driver_id");
  }
};
