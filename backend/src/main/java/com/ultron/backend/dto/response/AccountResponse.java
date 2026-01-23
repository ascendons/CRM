package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.CompanySize;
import com.ultron.backend.domain.enums.Industry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {

    private String id;
    private String accountId;

    // Basic
    private String accountName;
    private String parentAccountId;
    private String parentAccountName;

    // Details
    private String accountType;
    private Industry industry;
    private CompanySize companySize;
    private BigDecimal annualRevenue;
    private Integer numberOfEmployees;
    private String ownership;

    // Contact
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

    // Business
    private String tickerSymbol;
    private String sicCode;
    private String naicsCode;
    private String dunsNumber;
    private String taxId;

    // Social
    private String linkedInPage;
    private String twitterHandle;
    private String facebookPage;

    // Relationship
    private String primaryContactId;
    private String primaryContactName;
    private String convertedFromLeadId;
    private LocalDateTime convertedDate;

    // Financial
    private String paymentTerms;
    private String creditStatus;
    private BigDecimal creditLimit;
    private String currency;

    // Metrics
    private Integer totalOpportunities;
    private Integer wonOpportunities;
    private Integer lostOpportunities;
    private BigDecimal totalRevenue;
    private BigDecimal lifetimeValue;
    private Integer totalContacts;

    // Owner
    private String ownerId;
    private String ownerName;

    // Engagement
    private LocalDateTime lastActivityDate;
    private LocalDateTime lastPurchaseDate;
    private LocalDateTime lastContactDate;
    private String accountStatus;

    // Additional
    private String description;
    private String rating;
    private List<String> tags;
    private String notes;

    // System
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;
}
