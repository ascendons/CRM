package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.OpportunityStage;
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
public class OpportunityResponse {

    private String id;
    private String opportunityId;

    // Basic Information
    private String opportunityName;
    private OpportunityStage stage;
    private BigDecimal amount;
    private Integer probability;
    private LocalDate expectedCloseDate;
    private LocalDate actualCloseDate;

    // Relationships
    private String accountId;
    private String accountName;
    private String primaryContactId;
    private String primaryContactName;
    private String convertedFromLeadId;
    private LocalDateTime convertedDate;

    // Sales Information
    private String type;
    private String leadSource;
    private String campaignSource;
    private String nextStep;
    private String description;

    // Financial Details
    private BigDecimal forecastAmount;
    private String currency;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    // Product/Service Information
    private List<String> products;
    private List<String> services;
    private String solutionOffered;

    // Competition
    private List<String> competitors;
    private String competitiveAdvantage;
    private String lossReason;

    // Engagement
    private Integer daysInStage;
    private LocalDate lastActivityDate;
    private Integer totalActivities;
    private Integer emailsSent;
    private Integer callsMade;
    private Integer meetingsHeld;

    // Decision Process
    private String decisionMaker;
    private String decisionCriteria;
    private String budgetConfirmed;
    private LocalDate decisionTimeframe;

    // Team
    private String ownerId;
    private String ownerName;
    private List<String> teamMembers;

    // Additional Information
    private String deliveryStatus;
    private String paymentTerms;
    private List<String> tags;
    private String notes;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    // Stage History
    private LocalDateTime prospectingDate;
    private LocalDateTime qualificationDate;
    private LocalDateTime needsAnalysisDate;
    private LocalDateTime proposalDate;
    private LocalDateTime negotiationDate;
    private LocalDateTime closedDate;
}
