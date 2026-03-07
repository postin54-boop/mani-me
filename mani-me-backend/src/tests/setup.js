/**
 * Test Setup - Runs before all tests
 * Sets up in-memory MongoDB and test utilities
 */

const mongoose = require('mongoose');

// Increase Jest timeout for slow CI environments
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (comment out to debug)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  // Generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },
  
  // Generate test user data
  generateUser: (overrides = {}) => ({
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: `+44${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    ...overrides,
  }),
  
  // Generate test shipment data
  generateShipment: (overrides = {}) => ({
    sender_name: 'Test Sender',
    sender_phone: '+447123456789',
    sender_email: 'sender@test.com',
    pickup_address: '123 Test Street',
    pickup_city: 'London',
    pickup_postcode: 'SW1A 1AA',
    pickup_date: new Date(Date.now() + 86400000), // Tomorrow
    pickup_time: '10:00-12:00',
    receiver_name: 'Test Receiver',
    receiver_phone: '+233501234567',
    delivery_address: '456 Ghana Street',
    delivery_city: 'Accra',
    delivery_region: 'Greater Accra',
    parcel_size: 'medium_box',
    parcel_description: 'Test parcel',
    weight_kg: 5,
    total_cost: 75,
    ...overrides,
  }),
};

// Cleanup after all tests
afterAll(async () => {
  // Close mongoose connection if open
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
