package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.BillingCycle;
import com.ultron.backend.domain.enums.ContractType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContractRequest {

    @NotBlank(message = "Account ID is required")
    private String accountId;

    @NotNull(message = "Contract type is required")
    private ContractType type;

    private List<String> assetIds;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private BillingCycle billingCycle;
    private Integer visitFrequencyPerYear;
    private BigDecimal contractValue;

    // SLA
    private Integer slaResponseHrs;
    private Integer slaResolutionHrs;

    // Penalty
    private BigDecimal perHourBreachPenalty;
    private BigDecimal maxPenaltyCap;

    private String notes;
}
