package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a new warehouse
 */
@Data
public class CreateWarehouseRequest {

    private String code; // Optional - auto-generated if not provided

    @NotBlank(message = "Warehouse name is required")
    private String name;

    @NotBlank(message = "Warehouse type is required")
    private String type; // MAIN, BRANCH, VIRTUAL, TRANSIT

    @NotNull(message = "Address is required")
    private AddressDto address;

    private String managerId;
    private String managerName;

    private Boolean isActive = true;
    private Boolean isDefault = false;

    @Data
    public static class AddressDto {
        @NotBlank(message = "Address line 1 is required")
        private String line1;
        private String line2;

        @NotBlank(message = "City is required")
        private String city;

        @NotBlank(message = "State is required")
        private String state;

        @NotBlank(message = "Country is required")
        private String country;

        @NotBlank(message = "Postal code is required")
        private String postalCode;

        private String landmark;
    }
}
