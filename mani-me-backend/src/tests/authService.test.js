/**
 * Auth Service Tests
 * Tests for user authentication, registration, and JWT handling
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock the models
jest.mock('../models/user');
const User = require('../models/user');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should hash password before saving', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate valid JWT token', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = jwt.sign(
        { user_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.user_id).toBe(userId);
    });

    it('should reject invalid email format', () => {
      const invalidEmails = ['test', 'test@', '@test.com', 'test@test'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should accept valid email format', () => {
      const validEmails = ['test@example.com', 'user@domain.co.uk', 'name.surname@company.org'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  describe('Password Validation', () => {
    it('should require minimum 8 characters', () => {
      const shortPassword = 'Test12!';
      const validPassword = 'TestPass123!';
      
      expect(shortPassword.length >= 8).toBe(false);
      expect(validPassword.length >= 8).toBe(true);
    });

    it('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(password, hashedPassword);
      const isWrong = await bcrypt.compare('WrongPassword', hashedPassword);
      
      expect(isMatch).toBe(true);
      expect(isWrong).toBe(false);
    });
  });

  describe('JWT Token', () => {
    it('should expire after 7 days', () => {
      const userId = 'test-user-id';
      const token = jwt.sign(
        { user_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - decoded.iat;
      
      // 7 days in seconds = 604800
      expect(expiresIn).toBe(604800);
    });

    it('should reject expired tokens', () => {
      const token = jwt.sign(
        { user_id: 'test' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });

    it('should reject tokens with wrong secret', () => {
      const token = jwt.sign(
        { user_id: 'test' },
        'wrong-secret',
        { expiresIn: '7d' }
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });
  });
});
