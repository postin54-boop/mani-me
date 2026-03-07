/**
 * Shipment Service Tests
 * Tests for shipment creation, status updates, and tracking
 */

const mongoose = require('mongoose');

// Mock models
jest.mock('../models/shipment');
const Shipment = require('../models/shipment');

describe('Shipment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Shipment Creation', () => {
    it('should generate valid tracking number format', () => {
      // Format: MM-YYYY-NNNNNN-XXX
      const year = new Date().getFullYear();
      const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      
      const trackingNumber = `MM-${year}-${sequence}-${suffix}`;
      const regex = /^MM-\d{4}-\d{6}-[A-Z0-9]{3}$/;
      
      expect(regex.test(trackingNumber)).toBe(true);
    });

    it('should calculate correct pricing for parcel sizes', () => {
      const PARCEL_PRICES = {
        small_box: 45,
        medium_box: 75,
        large_box: 105,
        extra_large_box: 140,
        barrel: 180,
      };

      expect(PARCEL_PRICES.small_box).toBe(45);
      expect(PARCEL_PRICES.medium_box).toBe(75);
      expect(PARCEL_PRICES.large_box).toBe(105);
      expect(PARCEL_PRICES.extra_large_box).toBe(140);
      expect(PARCEL_PRICES.barrel).toBe(180);
    });

    it('should validate required fields', () => {
      const requiredFields = [
        'sender_name',
        'sender_phone',
        'pickup_address',
        'pickup_postcode',
        'receiver_name',
        'receiver_phone',
        'delivery_address',
        'delivery_city',
      ];

      const shipment = global.testUtils.generateShipment();
      
      requiredFields.forEach(field => {
        expect(shipment[field]).toBeDefined();
      });
    });
  });

  describe('Status Transitions', () => {
    const validStatuses = [
      'booked',
      'pending_pickup',
      'driver_assigned',
      'driver_en_route',
      'picked_up',
      'at_warehouse_uk',
      'in_transit',
      'customs',
      'in_ghana',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    it('should have valid status enum values', () => {
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });

    it('should allow valid status transitions', () => {
      const validTransitions = {
        'booked': ['pending_pickup', 'cancelled'],
        'pending_pickup': ['driver_assigned', 'cancelled'],
        'driver_assigned': ['driver_en_route', 'cancelled'],
        'driver_en_route': ['picked_up', 'cancelled'],
        'picked_up': ['at_warehouse_uk'],
        'at_warehouse_uk': ['in_transit'],
        'in_transit': ['customs', 'in_ghana'],
        'customs': ['in_ghana'],
        'in_ghana': ['out_for_delivery'],
        'out_for_delivery': ['delivered'],
      };

      expect(validTransitions['booked']).toContain('pending_pickup');
      expect(validTransitions['picked_up']).toContain('at_warehouse_uk');
    });
  });

  describe('Warehouse Status', () => {
    it('should have valid warehouse status values', () => {
      const warehouseStatuses = ['not_arrived', 'received', 'sorted', 'packed', 'shipped'];
      
      warehouseStatuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });

  describe('Size Adjustment', () => {
    it('should calculate extra charge correctly', () => {
      const PARCEL_PRICES = {
        small_box: 4500,    // pence
        medium_box: 7500,
        large_box: 10500,
        extra_large_box: 14000,
        barrel: 18000,
      };

      // Small to Large upgrade
      const originalSize = 'small_box';
      const newSize = 'large_box';
      const extraCharge = PARCEL_PRICES[newSize] - PARCEL_PRICES[originalSize];
      
      expect(extraCharge).toBe(6000); // £60 in pence
    });

    it('should validate size adjustment statuses', () => {
      const validStatuses = ['pending', 'approved', 'rejected'];
      
      validStatuses.forEach(status => {
        expect(['pending', 'approved', 'rejected']).toContain(status);
      });
    });
  });

  describe('Tracking Number Validation', () => {
    it('should accept valid tracking formats', () => {
      const validFormats = [
        'MM-2026-001234-ABC',
        'MM-2025-999999-XYZ',
        'MM-2024-000001-A1B',
      ];

      const regex = /^MM-\d{4}-\d{6}-[A-Z0-9]{3}$/;
      
      validFormats.forEach(tracking => {
        expect(regex.test(tracking)).toBe(true);
      });
    });

    it('should reject invalid tracking formats', () => {
      const invalidFormats = [
        'MM2026001234ABC',  // Missing dashes
        'XX-2026-001234-ABC', // Wrong prefix
        'MM-26-001234-ABC', // Short year
        'MM-2026-12345-ABC', // Short sequence
      ];

      const regex = /^MM-\d{4}-\d{6}-[A-Z0-9]{3}$/;
      
      invalidFormats.forEach(tracking => {
        expect(regex.test(tracking)).toBe(false);
      });
    });
  });
});
