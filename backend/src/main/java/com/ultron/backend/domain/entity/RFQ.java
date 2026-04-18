package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.RFQStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rfqs")
public class RFQ {

    @Id
    private String id;

    @Indexed(unique = true)
    private String rfqNumber;           // RFQ-timestamp

    @Indexed
    private String tenantId;

    private String description;
    private List<RFQItem> items;
    private List<String> vendorIds;
    private LocalDate deadline;
    private List<VendorResponse> responses;
    private String selectedVendorId;
    private RFQStatus status;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RFQItem {
        private String partId;
        private Integer qty;
        private String specs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendorResponse {
        private String vendorId;
        private BigDecimal unitPrice;
        private Integer deliveryDays;
        private String notes;
        private LocalDateTime submittedAt;
    }
}
