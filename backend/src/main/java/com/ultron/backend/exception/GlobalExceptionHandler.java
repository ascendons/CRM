package com.ultron.backend.exception;

import com.ultron.backend.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.ultron.backend.multitenancy.TenantContextMissingException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.expression.spel.SpelEvaluationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.warn("Validation failed: {}", errors);
        ApiResponse<Object> response = ApiResponse.error("Validation failed", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
    
    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateKey(DuplicateKeyException ex) {
        log.error("Duplicate key error: {}", ex.getMessage());
        String message = "A record with this unique identifier already exists.";
        if (ex.getMessage() != null && ex.getMessage().contains("locationId_tenantId_unique")) {
            message = "An office location with this ID already exists. Please try again.";
        } else if (ex.getMessage() != null && ex.getMessage().contains("code_tenantId_unique")) {
            message = "An office location with this code already exists.";
        }
        ApiResponse<Object> response = ApiResponse.error(message, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidCredentials(InvalidCredentialsException ex) {
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(UserInactiveException.class)
    public ResponseEntity<ApiResponse<Object>> handleUserInactive(UserInactiveException ex) {
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle UnauthorizedException for security violations (403 Forbidden).
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized access attempt: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle SecurityException for security violations (403 Forbidden).
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Object>> handleSecurityException(SecurityException ex) {
        log.error("Security violation: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error("Access denied", null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle IllegalArgumentException for invalid input (400 Bad Request).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Invalid argument: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle malformed JSON / invalid enum values (400 Bad Request).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());
        String message = "Invalid request body. Please check the request format and field values.";
        // Extract useful info for enum deserialization errors
        if (ex.getMessage() != null && ex.getMessage().contains("not one of the values accepted")) {
            message = "Invalid field value. " + ex.getMessage();
        }
        ApiResponse<Object> response = ApiResponse.error(message, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle ConstraintViolationException for @PathVariable / @RequestParam validation (400).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(cv -> {
            String field = cv.getPropertyPath().toString();
            // Remove method prefix (e.g. "methodName.paramName" -> "paramName")
            if (field.contains(".")) { field = field.substring(field.lastIndexOf('.') + 1); }
            errors.put(field, cv.getMessage());
        });
        log.warn("Constraint violation: {}", errors);
        ApiResponse<Object> response = ApiResponse.error("Validation failed", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException ex) {
        log.warn("Business rule violation: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    @ExceptionHandler(TenantContextMissingException.class)
    public ResponseEntity<ApiResponse<Object>> handleTenantContextMissing(TenantContextMissingException ex) {
        log.error("Tenant context missing: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error("Organization context is missing. Please log in again.", null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(SpelEvaluationException.class)
    public ResponseEntity<ApiResponse<Object>> handleSpelException(SpelEvaluationException ex) {
        log.error("SpEL Evaluation Error: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error("An internal caching error occurred.", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
 
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthorizationDenied(AuthorizationDeniedException ex) {
        log.warn("Permission denied: {}", ex.getMessage());
        ApiResponse<Object> response = ApiResponse.error("You do not have permission to perform this action.", null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle all other unexpected exceptions (500 Internal Server Error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        ApiResponse<Object> response = ApiResponse.error(
                "An unexpected error occurred. Please try again later.",
                null
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
