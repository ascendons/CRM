package com.ultron.backend.exception;

/**
 * Business logic exception
 * Thrown when business rules are violated
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}
