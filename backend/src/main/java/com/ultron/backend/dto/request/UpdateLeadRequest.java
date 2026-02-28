package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.CompanySize;
import com.ultron.backend.domain.enums.Industry;
import com.ultron.backend.domain.enums.LeadSource;
import com.ultron.backend.domain.enums.LeadStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for updating an existing lead
 * All fields are optional - only provided fields will be updated
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLeadRequest {

    // Basic Information
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @Email(message = "Please provide a valid email address")
    private String email;

    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone must be 10-15 digits with optional + prefix")
    private String phone;

    @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters")
    private String companyName;

    @Size(max = 50, message = "GST Number must be less than 50 characters")
    private String gstNumber;

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

    // Address Information
    private String country;
    private String state;
    private String city;
    private String streetAddress;
    private String postalCode;

    // Lead Classification
    private LeadSource leadSource;
    private LeadStatus leadStatus;
    private String leadOwnerId;
    private BigDecimal expectedRevenue;
    private LocalDate expectedCloseDate;

    // BANT Qualification - Budget
    private Boolean hasBudget;
    private BigDecimal budgetAmount;
    private String budgetTimeframe;

    // BANT Qualification - Authority
    private Boolean isDecisionMaker;
    private String decisionMakerName;

    // BANT Qualification - Need
    private String businessProblem;
    private String painPoints;

    // BANT Qualification - Timeline
    private LocalDate expectedPurchaseDate;
    private String urgencyLevel;

    // Additional Information
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private List<String> tags;
}
