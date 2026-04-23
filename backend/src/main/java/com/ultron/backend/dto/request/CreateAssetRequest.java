package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssetRequest {

    @NotBlank(message = "Serial number is required")
    private String serialNo;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    private String accountId;
    private String contactId;
    private String assignedEngineerId;

    @NotBlank(message = "Site address is required")
    private String siteAddress;

    private Double siteLat;
    private Double siteLng;

    private LocalDate installDate;
    private LocalDate warrantyExpiry;

    private AssetStatus status;
    private String notes;
}
