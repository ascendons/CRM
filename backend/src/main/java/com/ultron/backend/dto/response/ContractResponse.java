package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.BillingCycle;
import com.ultron.backend.domain.enums.ContractStatus;
import com.ultron.backend.domain.enums.ContractType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {
    private String id;
    private String contractNumber;
    private ContractType type;
    private String accountId;
    private List<String> assetIds;
    private LocalDate startDate;
    private LocalDate endDate;
    private BillingCycle billingCycle;
    private Integer visitFrequencyPerYear;
    private BigDecimal contractValue;
    private Integer slaResponseHrs;
    private Integer slaResolutionHrs;
    private BigDecimal perHourBreachPenalty;
    private BigDecimal maxPenaltyCap;
    private ContractStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
