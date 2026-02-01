package com.ultron.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

/**
 * Validator for ValidUntilConstraint
 * Checks that the date is in the future and not more than specified months ahead
 */
public class ValidUntilValidator implements ConstraintValidator<ValidUntilConstraint, LocalDate> {

    private int maxMonths;

    @Override
    public void initialize(ValidUntilConstraint constraintAnnotation) {
        this.maxMonths = constraintAnnotation.maxMonths();
    }

    @Override
    public boolean isValid(LocalDate value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // @NotNull should handle null check
        }

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusMonths(maxMonths);

        // Check if date is in the future
        if (!value.isAfter(today)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Valid until date must be in the future")
                    .addConstraintViolation();
            return false;
        }

        // Check if date is not too far in the future
        if (value.isAfter(maxDate)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    String.format("Valid until date cannot be more than %d months in the future", maxMonths))
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
