"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "country", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "verification_status", {
      type: Sequelize.ENUM("pending", "verified", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "country");
    await queryInterface.removeColumn("users", "verification_status");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_verification_status";'
    );
  },
};
