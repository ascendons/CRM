package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.*;
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
@Document(collection = "leads")
public class Lead {

    @Id
    private String id;

    // Unique Lead ID: LEAD-YYYY-MM-XXXXX
    @Indexed(unique = true)
    private String leadId;

    // ===== Basic Information =====
    private String firstName;
    private String lastName;

    @Indexed(unique = true)
    private String email;

    private String phone;
    private String companyName;

    // ===== Contact Details =====
    private String jobTitle;
    private String department;
    private String mobilePhone;
    private String workPhone;
    private String linkedInProfile;
    private String website;

    // ===== Company Information =====
    private Industry industry;
    private CompanySize companySize;
    private BigDecimal annualRevenue;
    private Integer numberOfEmployees;

    // ===== Address Information =====
    private String country;
    private String state;
    private String city;
    private String streetAddress;
    private String postalCode;

    // ===== Lead Classification =====
    private LeadSource leadSource;
    private LeadStatus leadStatus;
    private String leadOwnerId;  // Reference to User ID
    private BigDecimal expectedRevenue;
    private LocalDate expectedCloseDate;

    // ===== Additional Information =====
    private String description;
    private List<String> tags;

    // ===== Lead Scoring =====
    private Integer leadScore;  // 0-100
    private String leadGrade;   // A, B, C, D
    private Integer demographicScore;  // 0-40
    private Integer behavioralScore;   // 0-60

    // ===== BANT Qualification Fields =====
    // Budget
    private Boolean hasBudget;
    private BigDecimal budgetAmount;
    private String budgetTimeframe;
    private String budgetApprovalStatus;

    // Authority
    private Boolean isDecisionMaker;
    private String decisionMakerName;
    private String decisionMakerTitle;
    private String decisionMakerContact;
    private String decisionMakingProcess;
    private String leadRoleInDecision;

    // Need
    private String businessProblem;
    private String painPoints;
    private String currentSolution;
    private String whyChangeNow;
    private String impactOfNotSolving;
    private String successMetrics;

    // Timeline
    private LocalDate expectedPurchaseDate;
    private LocalDate projectStartDate;
    private String urgencyLevel;
    private String timelineDrivers;
    private String potentialDelays;

    // Qualification Score (0-100)
    private Integer qualificationScore;

    // ===== Conversion Fields =====
    private LocalDateTime convertedDate;
    private String convertedToOpportunityId;
    private String convertedToContactId;
    private String convertedToAccountId;

    // ===== System Fields =====
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private LocalDateTime lastActivityDate;

    // For soft delete
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deletedBy;
}
