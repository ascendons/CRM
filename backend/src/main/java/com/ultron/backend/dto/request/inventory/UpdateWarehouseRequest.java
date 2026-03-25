package com.ultron.backend.dto.request.inventory;

import lombok.Data;

/**
 * Request DTO for updating a warehouse
 */
@Data
public class UpdateWarehouseRequest {

    private String name;
    private String type;
    private CreateWarehouseRequest.AddressDto address;
    private String managerId;
    private String managerName;
    private Boolean isActive;
    private Boolean isDefault;
}
