package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for adding a storage location to a warehouse
 */
@Data
public class AddStorageLocationRequest {

    private String code; // Optional - e.g., A-01-01

    @NotBlank(message = "Location name is required")
    private String name;

    private String type; // SHELF, RACK, BIN, PALLET, FLOOR

    private Integer capacity; // Optional capacity limit
    private Boolean isActive = true;
}
