package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vendor_parts")
public class VendorPart {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String vendorId;
    private String partId;
    private String vendorPartNumber;
    private BigDecimal lastPurchasePrice;
    private Integer leadTimeDays;
    private Boolean preferredVendor;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
