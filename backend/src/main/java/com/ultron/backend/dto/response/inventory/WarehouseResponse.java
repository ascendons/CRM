package com.ultron.backend.dto.response.inventory;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for warehouse
 */
@Data
public class WarehouseResponse {

    private String id;
    private String code;
    private String name;
    private String type;
    private AddressDto address;
    private String managerId;
    private String managerName;
    private Boolean isActive;
    private Boolean isDefault;
    private List<StorageLocationDto> locations;
    private LocalDateTime createdAt;
    private String createdBy;

    @Data
    public static class AddressDto {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private String landmark;
    }

    @Data
    public static class StorageLocationDto {
        private String id;
        private String code;
        private String name;
        private String type;
        private Integer capacity;
        private Boolean isActive;
    }
}
