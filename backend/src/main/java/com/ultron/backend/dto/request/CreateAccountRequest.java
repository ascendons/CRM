package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.CompanySize;
import com.ultron.backend.domain.enums.Industry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequest {

    // Required
    @NotBlank(message = "Account name is required")
    @Size(min = 2, max = 100, message = "Account name must be between 2 and 100 characters")
    private String accountName;

    // Optional basic fields
    private String parentAccountId;
    private String accountType;
    private Industry industry;
    private CompanySize companySize;
    private BigDecimal annualRevenue;
    private Integer numberOfEmployees;
    private String ownership;

    // Contact Information
    private String phone;
    private String fax;
    private String website;
    private String email;

    // Billing Address
    private String billingStreet;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;

    // Shipping Address
    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingPostalCode;
    private String shippingCountry;

    // Business Information
    private String tickerSymbol;
    private String sicCode;
    private String naicsCode;
    private String dunsNumber;
    private String taxId;

    // Social
    private String linkedInPage;
    private String twitterHandle;
    private String facebookPage;

    // Financial
    private String paymentTerms;
    private String creditStatus;
    private BigDecimal creditLimit;
    private String currency;

    // Additional
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private String rating;
    private List<String> tags;
    private String notes;
}
