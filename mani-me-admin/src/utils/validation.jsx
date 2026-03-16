/**
 * Input Validation Utilities for Admin Dashboard
 * Provides consistent validation across all forms
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (10-15 digits)
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Validate price/amount (positive number)
 */
export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

/**
 * Validate positive integer
 */
export const isValidQuantity = (qty) => {
  const num = parseInt(qty, 10);
  return !isNaN(num) && num >= 0 && Number.isInteger(num);
};

/**
 * Validate non-empty string
 */
export const isNotEmpty = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
};

/**
 * Sanitize string input (remove potential XSS)
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validate form fields and return errors
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  
  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const value = fields[fieldName];
    
    for (const rule of fieldRules) {
      if (rule.required && !isNotEmpty(value)) {
        errors[fieldName] = rule.message || `${fieldName} is required`;
        break;
      }
      if (rule.email && value && !isValidEmail(value)) {
        errors[fieldName] = rule.message || 'Invalid email format';
        break;
      }
      if (rule.phone && value && !isValidPhone(value)) {
        errors[fieldName] = rule.message || 'Invalid phone number';
        break;
      }
      if (rule.minLength && value && value.length < rule.minLength) {
        errors[fieldName] = rule.message || `Minimum ${rule.minLength} characters required`;
        break;
      }
      if (rule.price && value && !isValidPrice(value)) {
        errors[fieldName] = rule.message || 'Invalid price';
        break;
      }
      if (rule.custom && !rule.custom(value)) {
        errors[fieldName] = rule.message || 'Invalid value';
        break;
      }
    }
  }
  
  return errors;
};

export default {
  isValidEmail,
  isValidPhone,
  isValidPrice,
  isValidQuantity,
  isNotEmpty,
  isValidUrl,
  isStrongPassword,
  sanitizeString,
  validateForm,
};
