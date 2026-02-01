package com.ultron.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom validation annotation for validUntil field
 * Ensures the date is in the future but not more than 1 year ahead
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = ValidUntilValidator.class)
public @interface ValidUntilConstraint {

    String message() default "Valid until date must be in the future and not more than 1 year ahead";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    int maxMonths() default 12;
}
