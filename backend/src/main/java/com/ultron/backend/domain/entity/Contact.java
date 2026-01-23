package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Contact entity - Represents an individual person in the CRM
 * Contacts are associated with Accounts (companies)
 */
@Document(collection = "contacts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    private String id;

    @Indexed(unique = true)
    private String contactId;  // CONT-YYYY-MM-XXXXX

    // ===== Basic Information =====
    private String firstName;
    private String lastName;
    private String salutation;  // Mr., Mrs., Ms., Dr., Prof.

    @Indexed
    private String email;
    private String phone;
    private String mobilePhone;
    private String workPhone;
    private String homePhone;
    private String fax;

    // ===== Professional Information =====
    private String jobTitle;
    private String department;
    private String reportsTo;  // Reference to another Contact ID
    private LocalDate birthdate;
    private Boolean emailOptOut;

    // ===== Social & Web =====
    private String linkedInProfile;
    private String twitterHandle;
    private String facebookProfile;
    private String website;
    private String skypeId;

    // ===== Account Relationship =====
    @Indexed
    private String accountId;  // Reference to Account
    private String accountName;  // Denormalized for quick access
    private Boolean isPrimaryContact;  // Is this the main contact for the account?

    // ===== Lead Relationship =====
    private String convertedFromLeadId;  // Reference to original Lead
    private LocalDateTime convertedDate;

    // ===== Address Information =====
    // Mailing Address
    private String mailingStreet;
    private String mailingCity;
    private String mailingState;
    private String mailingPostalCode;
    private String mailingCountry;

    // Other Address
    private String otherStreet;
    private String otherCity;
    private String otherState;
    private String otherPostalCode;
    private String otherCountry;

    // ===== Additional Information =====
    private String description;
    private String assistantName;
    private String assistantPhone;
    private List<String> tags;

    // ===== Contact Owner =====
    @Indexed
    private String ownerId;  // Reference to User who owns this contact
    private String ownerName;  // Denormalized

    // ===== Engagement & Activity =====
    private LocalDateTime lastActivityDate;
    private LocalDateTime lastEmailDate;
    private LocalDateTime lastCallDate;
    private LocalDateTime lastMeetingDate;
    private Integer emailsSent;
    private Integer emailsReceived;
    private Integer callsMade;
    private Integer callsReceived;
    private Integer meetingsHeld;

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
