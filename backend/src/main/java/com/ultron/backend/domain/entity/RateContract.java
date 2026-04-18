package com.ultron.backend.domain.entity;

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
@Document(collection = "rate_contracts")
public class RateContract {

    @Id
    private String id;

    @Indexed(unique = true)
    private String rcNumber;            // RC-timestamp

    @Indexed
    private String tenantId;

    private String vendorId;
    private List<RateContractItem> lineItems;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean autoRenew;
    private String status;              // Active / Expired / Terminated

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateContractItem {
        private String partId;
        private BigDecimal agreedUnitPrice;
        private Integer minOrderQty;
    }
}
