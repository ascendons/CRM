package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.*;
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
public class CreateLeadRequest {

    // Basic Information (Required)
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone must be 10-15 digits")
    private String phone;

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters")
    private String companyName;

    // Contact Details (Optional)
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
    private String leadOwnerId;  // If null, defaults to current user
    private BigDecimal expectedRevenue;
    private LocalDate expectedCloseDate;

    // Additional Information
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;
    private List<String> tags;
}
