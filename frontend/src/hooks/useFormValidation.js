import { useState, useCallback } from "react";
import { validateForm, validateField } from "../utils/validation";

/**
 * Custom hook for form validation
 * Provides validation state management and helper functions
 *
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Function} onSubmit - Callback function when form is valid and submitted
 *
 * @returns {Object} Form state and helper functions
 */
const useFormValidation = (initialValues, validationRules, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;
      const fieldValue = type === "checkbox" ? checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors]
  );

  /**
   * Handle input change for nested fields (e.g., address.city)
   */
  const handleNestedChange = useCallback(
    (name) => (event) => {
      const { value, type, checked } = event.target;
      const fieldValue = type === "checkbox" ? checked : value;

      setValues((prev) => {
        const keys = name.split(".");
        const newValues = { ...prev };
        let current = newValues;

        // Navigate to nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Set the value
        current[keys[keys.length - 1]] = fieldValue;

        return newValues;
      });

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors]
  );

  /**
   * Handle field blur - validate on blur
   */
  const handleBlur = useCallback(
    (event) => {
      const { name } = event.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate field on blur
      if (validationRules[name]) {
        const value = getNestedValue(values, name);
        const result = validateField(name, value, validationRules[name]);

        if (!result.isValid) {
          setErrors((prev) => ({
            ...prev,
            [name]: result.error,
          }));
        }
      }
    },
    [values, validationRules]
  );

  /**
   * Validate all fields
   */
  const validate = useCallback(() => {
    const result = validateForm(values, validationRules);
    setErrors(result.errors);
    return result.isValid;
  }, [values, validationRules]);

  /**
   * Handle form submit
   */
  const handleSubmit = useCallback(
    async (event) => {
      if (event) {
        event.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validate all fields
      const isValid = validate();

      if (isValid) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error("Form submission error:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validationRules, onSubmit, validate]
  );

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set form values programmatically
   */
  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
  }, []);

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Set field error manually
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  /**
   * Get nested value from object using dot notation
   */
  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  /**
   * Check if field has error and has been touched
   */
  const hasError = (fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  };

  /**
   * Get error message for field
   */
  const getError = (fieldName) => {
    return hasError(fieldName) ? errors[fieldName] : "";
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleNestedChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormValues,
    setFieldValue,
    setFieldError,
    validate,
    hasError,
    getError,
  };
};

export default useFormValidation;
