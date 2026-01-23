package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.CompanySize;
import com.ultron.backend.domain.enums.Industry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Account entity - Represents a company/organization in the CRM
 * Accounts have multiple Contacts and Opportunities
 */
@Document(collection = "accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    private String id;

    @Indexed(unique = true)
    private String accountId;  // ACC-YYYY-MM-XXXXX

    // ===== Basic Information =====
    @Indexed
    private String accountName;
    private String parentAccountId;  // Reference to parent Account (for subsidiaries)
    private String parentAccountName;  // Denormalized

    // ===== Account Details =====
    private String accountType;  // Prospect, Customer, Partner, Reseller, Competitor
    private Industry industry;
    private CompanySize companySize;
    private BigDecimal annualRevenue;
    private Integer numberOfEmployees;
    private String ownership;  // Public, Private, Subsidiary, Government

    // ===== Contact Information =====
    @Indexed
    private String phone;
    private String fax;
    @Indexed
    private String website;
    private String email;  // General company email

    // ===== Address Information =====
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

    // ===== Business Information =====
    private String tickerSymbol;  // Stock ticker for public companies
    private String sicCode;  // Standard Industrial Classification
    private String naicsCode;  // North American Industry Classification System
    private String dunsNumber;  // Dun & Bradstreet number
    private String taxId;  // Tax identification number

    // ===== Social & Web Presence =====
    private String linkedInPage;
    private String twitterHandle;
    private String facebookPage;

    // ===== Relationship Information =====
    private String primaryContactId;  // Reference to primary Contact
    private String primaryContactName;  // Denormalized

    // ===== Lead Relationship =====
    private String convertedFromLeadId;  // Reference to original Lead
    private LocalDateTime convertedDate;

    // ===== Financial Information =====
    private String paymentTerms;  // Net 30, Net 60, COD, etc.
    private String creditStatus;  // Good, Hold, Review
    private BigDecimal creditLimit;
    private String currency;  // USD, EUR, GBP, etc.

    // ===== Account Metrics =====
    private Integer totalOpportunities;
    private Integer wonOpportunities;
    private Integer lostOpportunities;
    private BigDecimal totalRevenue;
    private BigDecimal lifetimeValue;
    private Integer totalContacts;

    // ===== Account Owner =====
    @Indexed
    private String ownerId;  // Reference to User who owns this account
    private String ownerName;  // Denormalized

    // ===== Engagement & Activity =====
    private LocalDateTime lastActivityDate;
    private LocalDateTime lastPurchaseDate;
    private LocalDateTime lastContactDate;
    private String accountStatus;  // Active, Inactive, Prospecting, Customer, Former Customer

    // ===== Additional Information =====
    private String description;
    private String rating;  // Hot, Warm, Cold
    private List<String> tags;
    private String notes;

    // ===== System Fields =====
    private LocalDateTime createdAt;
    private String createdBy;  // User ID
    private String createdByName;  // Denormalized

    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;  // User ID
    private String lastModifiedByName;  // Denormalized

    // ===== Soft Delete =====
    @Indexed
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deletedBy;

    // ===== Multi-tenancy =====
    @Indexed
    private String tenantId;
}
