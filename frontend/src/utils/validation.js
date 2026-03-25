/**
 * Form Validation Utilities
 * Provides reusable validation functions for form inputs
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the value is valid
 * @property {string} error - Error message if invalid
 */

/**
 * Required field validator
 */
export const required = (value, fieldName = 'This field') => {
  const isValid = value !== null && value !== undefined && value !== '';
  return {
    isValid,
    error: isValid ? '' : `${fieldName} is required`,
  };
};

/**
 * Email validator
 */
export const email = (value, fieldName = 'Email') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(value);

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be a valid email address`,
  };
};

/**
 * Phone number validator
 */
export const phone = (value, fieldName = 'Phone number') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  // Accepts formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  const isValid = phoneRegex.test(value.replace(/\s/g, ''));

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be a valid phone number`,
  };
};

/**
 * Minimum length validator
 */
export const minLength = (min) => (value, fieldName = 'This field') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const isValid = value.length >= min;
  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be at least ${min} characters`,
  };
};

/**
 * Maximum length validator
 */
export const maxLength = (max) => (value, fieldName = 'This field') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const isValid = value.length <= max;
  return {
    isValid,
    error: isValid ? '' : `${fieldName} must not exceed ${max} characters`,
  };
};

/**
 * Minimum value validator (for numbers)
 */
export const minValue = (min) => (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, error: '' }; // Optional field
  }

  const numValue = Number(value);
  const isValid = !isNaN(numValue) && numValue >= min;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be at least ${min}`,
  };
};

/**
 * Maximum value validator (for numbers)
 */
export const maxValue = (max) => (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, error: '' }; // Optional field
  }

  const numValue = Number(value);
  const isValid = !isNaN(numValue) && numValue <= max;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must not exceed ${max}`,
  };
};

/**
 * Positive number validator
 */
export const positiveNumber = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, error: '' }; // Optional field
  }

  const numValue = Number(value);
  const isValid = !isNaN(numValue) && numValue > 0;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be a positive number`,
  };
};

/**
 * Non-negative number validator (including zero)
 */
export const nonNegativeNumber = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, error: '' }; // Optional field
  }

  const numValue = Number(value);
  const isValid = !isNaN(numValue) && numValue >= 0;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be zero or greater`,
  };
};

/**
 * Integer validator
 */
export const integer = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, error: '' }; // Optional field
  }

  const numValue = Number(value);
  const isValid = !isNaN(numValue) && Number.isInteger(numValue);

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be a whole number`,
  };
};

/**
 * Date validator (checks if valid date)
 */
export const validDate = (value, fieldName = 'Date') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const date = new Date(value);
  const isValid = date instanceof Date && !isNaN(date);

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be a valid date`,
  };
};

/**
 * Future date validator
 */
export const futureDate = (value, fieldName = 'Date') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const date = new Date(value);
  const now = new Date();
  const isValid = date > now;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be in the future`,
  };
};

/**
 * Past date validator
 */
export const pastDate = (value, fieldName = 'Date') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const date = new Date(value);
  const now = new Date();
  const isValid = date < now;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be in the past`,
  };
};

/**
 * Date after another date validator
 */
export const dateAfter = (compareDate) => (value, fieldName = 'Date') => {
  if (!value || !compareDate) return { isValid: true, error: '' };

  const date = new Date(value);
  const compare = new Date(compareDate);
  const isValid = date > compare;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be after the reference date`,
  };
};

/**
 * Date before another date validator
 */
export const dateBefore = (compareDate) => (value, fieldName = 'Date') => {
  if (!value || !compareDate) return { isValid: true, error: '' };

  const date = new Date(value);
  const compare = new Date(compareDate);
  const isValid = date < compare;

  return {
    isValid,
    error: isValid ? '' : `${fieldName} must be before the reference date`,
  };
};

/**
 * Pattern validator (regex)
 */
export const pattern = (regex, message) => (value, fieldName = 'This field') => {
  if (!value) return { isValid: true, error: '' }; // Optional field

  const isValid = regex.test(value);
  return {
    isValid,
    error: isValid ? '' : message || `${fieldName} format is invalid`,
  };
};

/**
 * Custom validator
 */
export const custom = (validatorFn, errorMessage) => (value, fieldName = 'This field') => {
  const isValid = validatorFn(value);
  return {
    isValid,
    error: isValid ? '' : errorMessage || `${fieldName} is invalid`,
  };
};

/**
 * Compose multiple validators
 * Returns first error encountered or success if all pass
 */
export const compose = (...validators) => (value, fieldName) => {
  for (const validator of validators) {
    const result = validator(value, fieldName);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true, error: '' };
};

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @param {Object} validationRules - Validation rules object { fieldName: validator }
 * @returns {Object} { isValid: boolean, errors: { fieldName: error } }
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach((fieldName) => {
    const validator = validationRules[fieldName];
    const value = formData[fieldName];
    const result = validator(value, fieldName);

    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Validate single field
 * @param {string} fieldName - Field name
 * @param {any} value - Field value
 * @param {function} validator - Validator function
 * @returns {ValidationResult}
 */
export const validateField = (fieldName, value, validator) => {
  return validator(value, fieldName);
};

/**
 * Create validation rules for warehouse form
 */
export const warehouseValidationRules = {
  name: compose(required, minLength(2), maxLength(100)),
  code: compose(required, minLength(2), maxLength(20), pattern(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')),
  'address.line1': compose(required, minLength(5), maxLength(200)),
  'address.city': compose(required, minLength(2), maxLength(100)),
  'address.state': compose(required, minLength(2), maxLength(100)),
  'address.postalCode': compose(required, minLength(3), maxLength(20)),
  'address.country': compose(required, minLength(2), maxLength(100)),
  contactEmail: email,
  contactPhone: phone,
  capacity: compose(positiveNumber, integer),
};

/**
 * Create validation rules for batch form
 */
export const batchValidationRules = {
  batchNumber: compose(required, minLength(2), maxLength(50)),
  productId: required,
  manufacturingDate: compose(required, validDate, pastDate),
  expiryDate: compose(required, validDate),
  initialQuantity: compose(required, positiveNumber, integer),
  supplier: minLength(2),
};

/**
 * Create validation rules for reservation form
 */
export const reservationValidationRules = {
  productId: required,
  warehouseId: required,
  quantity: compose(required, positiveNumber, integer),
  referenceType: required,
  referenceNumber: compose(required, minLength(2)),
  expiryDays: compose(required, positiveNumber, integer, minValue(1), maxValue(365)),
};

/**
 * Create validation rules for stock adjustment
 */
export const stockAdjustmentValidationRules = {
  direction: required,
  quantity: compose(required, positiveNumber, integer),
  reason: compose(required, minLength(5), maxLength(500)),
  unitCost: compose(required, positiveNumber),
};

/**
 * Create validation rules for stock transfer
 */
export const stockTransferValidationRules = {
  fromWarehouseId: required,
  toWarehouseId: compose(
    required,
    custom(
      (value, formData) => formData.fromWarehouseId !== value,
      'Cannot transfer to the same warehouse'
    )
  ),
  quantity: compose(required, positiveNumber, integer),
  reason: compose(required, minLength(5), maxLength(500)),
};

export default {
  required,
  email,
  phone,
  minLength,
  maxLength,
  minValue,
  maxValue,
  positiveNumber,
  nonNegativeNumber,
  integer,
  validDate,
  futureDate,
  pastDate,
  dateAfter,
  dateBefore,
  pattern,
  custom,
  compose,
  validateForm,
  validateField,
  warehouseValidationRules,
  batchValidationRules,
  reservationValidationRules,
  stockAdjustmentValidationRules,
  stockTransferValidationRules,
};
