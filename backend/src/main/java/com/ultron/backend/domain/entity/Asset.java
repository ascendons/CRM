package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assets")
public class Asset {

    @Id
    private String id;

    @Indexed(unique = true)
    private String assetCode;         // ASSET-YYYY-MM-XXXXX

    @Indexed
    private String tenantId;

    private String serialNo;
    private String model;
    private String brand;
    private String categoryId;        // ref → asset_categories

    // Linked records
    private String accountId;
    private String contactId;
    private String assignedEngineerId;

    // Location
    private String siteAddress;
    private Double siteLat;
    private Double siteLng;

    // Dates
    private LocalDate installDate;
    private LocalDate warrantyExpiry;

    private AssetStatus status;
    private String notes;

    // Audit
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
