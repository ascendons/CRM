package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.BillingCycle;
import com.ultron.backend.domain.enums.ContractStatus;
import com.ultron.backend.domain.enums.ContractType;
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
@Document(collection = "contracts")
public class Contract {

    @Id
    private String id;

    @Indexed(unique = true)
    private String contractNumber;     // CON-YYYY-MM-XXXXX

    @Indexed
    private String tenantId;

    private ContractType type;
    private String accountId;
    private List<String> assetIds;

    private LocalDate startDate;
    private LocalDate endDate;

    private BillingCycle billingCycle;
    private Integer visitFrequencyPerYear;
    private BigDecimal contractValue;

    // SLA Configuration
    private SlaConfig slaConfig;

    // Penalty Clauses
    private PenaltyConfig penaltyConfig;

    private ContractStatus status;
    private LocalDateTime renewalReminderSentAt;

    private String notes;

    // Audit
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlaConfig {
        private Integer responseHrs;
        private Integer resolutionHrs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PenaltyConfig {
        private BigDecimal perHourBreachPenalty;
        private BigDecimal maxPenaltyCap;
    }
}
