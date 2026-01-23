package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.OpportunityStage;
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
@Document(collection = "opportunities")
public class Opportunity {

    @Id
    private String id;

    // Unique Opportunity ID: OPP-YYYY-MM-XXXXX
    @Indexed(unique = true)
    private String opportunityId;

    // ===== Basic Information =====
    private String opportunityName;
    private OpportunityStage stage;
    private BigDecimal amount;
    private Integer probability;  // 0-100
    private LocalDate expectedCloseDate;
    private LocalDate actualCloseDate;

    // ===== Relationships =====
    private String accountId;
    private String accountName;
    private String primaryContactId;
    private String primaryContactName;
    private String convertedFromLeadId;
    private LocalDateTime convertedDate;

    // ===== Sales Information =====
    private String type;  // New Business, Existing Business, Add-on
    private String leadSource;
    private String campaignSource;
    private String nextStep;
    private String description;

    // ===== Financial Details =====
    private BigDecimal forecastAmount;
    private String currency;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    // ===== Product/Service Information =====
    private List<String> products;
    private List<String> services;
    private String solutionOffered;

    // ===== Competition =====
    private List<String> competitors;
    private String competitiveAdvantage;
    private String lossReason;  // If CLOSED_LOST

    // ===== Engagement =====
    private Integer daysInStage;
    private LocalDate lastActivityDate;
    private Integer totalActivities;
    private Integer emailsSent;
    private Integer callsMade;
    private Integer meetingsHeld;

    // ===== Decision Process =====
    private String decisionMaker;
    private String decisionCriteria;
    private String budgetConfirmed;
    private LocalDate decisionTimeframe;

    // ===== Team =====
    private String ownerId;
    private String ownerName;
    private List<String> teamMembers;

    // ===== Additional Information =====
    private String deliveryStatus;
    private String paymentTerms;
    private List<String> tags;
    private String notes;

    // ===== System Fields =====
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    // For soft delete
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deletedBy;

    // ===== Stage History (optional for future) =====
    // Track stage transitions
    private LocalDateTime prospectingDate;
    private LocalDateTime qualificationDate;
    private LocalDateTime needsAnalysisDate;
    private LocalDateTime proposalDate;
    private LocalDateTime negotiationDate;
    private LocalDateTime closedDate;
}
