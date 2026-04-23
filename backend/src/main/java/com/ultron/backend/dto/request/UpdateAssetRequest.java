package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAssetRequest {
    private String serialNo;
    private String model;
    private String brand;
    private String categoryId;
    private String accountId;
    private String contactId;
    private String assignedEngineerId;
    private String siteAddress;
    private Double siteLat;
    private Double siteLng;
    private LocalDate installDate;
    private LocalDate warrantyExpiry;
    private AssetStatus status;
    private String notes;
}
