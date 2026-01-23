package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.OpportunityStage;
import jakarta.validation.constraints.*;
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
public class CreateOpportunityRequest {

    // Required fields
    @NotBlank(message = "Opportunity name is required")
    @Size(min = 3, max = 200, message = "Opportunity name must be between 3 and 200 characters")
    private String opportunityName;

    @NotNull(message = "Stage is required")
    private OpportunityStage stage;

    @NotBlank(message = "Account ID is required")
    private String accountId;

    // Financial
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", message = "Amount must be positive")
    private BigDecimal amount;

    @Min(value = 0, message = "Probability must be between 0 and 100")
    @Max(value = 100, message = "Probability must be between 0 and 100")
    private Integer probability;

    @NotNull(message = "Expected close date is required")
    private LocalDate expectedCloseDate;

    // Optional fields
    private String primaryContactId;
    private String type;
    private String leadSource;
    private String campaignSource;
    private String nextStep;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private BigDecimal forecastAmount;
    private String currency;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    private List<String> products;
    private List<String> services;
    private String solutionOffered;

    private List<String> competitors;
    private String competitiveAdvantage;

    private String decisionMaker;
    private String decisionCriteria;
    private String budgetConfirmed;
    private LocalDate decisionTimeframe;

    private String deliveryStatus;
    private String paymentTerms;
    private List<String> tags;
    private String notes;
}
