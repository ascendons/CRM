package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.*;
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
public class LeadResponse {

    private String id;
    private String leadId;  // LEAD-YYYY-MM-XXXXX

    // Basic Information
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String companyName;

    // Contact Details
    private String jobTitle;
    private String department;
    private String mobilePhone;
    private String workPhone;
    private String linkedInProfile;
    private String website;

    // Company Information
    private Industry industry;
    private CompanySize companySize;
    private BigDecimal annualRevenue;
    private Integer numberOfEmployees;

    // Address
    private String country;
    private String state;
    private String city;
    private String streetAddress;
    private String postalCode;

    // Classification
    private LeadSource leadSource;
    private LeadStatus leadStatus;
    private String leadOwnerId;
    private String leadOwnerName;  // Populated from User
    private BigDecimal expectedRevenue;
    private LocalDate expectedCloseDate;

    // Additional Information
    private String description;
    private List<String> tags;

    // Scoring
    private Integer leadScore;
    private String leadGrade;
    private Integer demographicScore;
    private Integer behavioralScore;

    // Qualification
    private Integer qualificationScore;

    // Conversion Info
    private LocalDateTime convertedDate;
    private String convertedToOpportunityId;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private LocalDateTime lastActivityDate;
}
