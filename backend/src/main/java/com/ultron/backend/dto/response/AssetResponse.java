package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponse {
    private String id;
    private String assetCode;
    private String serialNo;
    private String model;
    private String brand;
    private String categoryId;
    private String categoryName;
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
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
