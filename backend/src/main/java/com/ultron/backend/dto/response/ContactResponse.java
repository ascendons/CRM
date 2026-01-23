package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {

    private String id;
    private String contactId;

    // Basic Information
    private String firstName;
    private String lastName;
    private String salutation;
    private String email;
    private String phone;
    private String mobilePhone;
    private String workPhone;
    private String homePhone;
    private String fax;

    // Professional
    private String jobTitle;
    private String department;
    private String reportsTo;
    private LocalDate birthdate;
    private Boolean emailOptOut;

    // Social & Web
    private String linkedInProfile;
    private String twitterHandle;
    private String facebookProfile;
    private String website;
    private String skypeId;

    // Account Relationship
    private String accountId;
    private String accountName;
    private Boolean isPrimaryContact;

    // Lead Relationship
    private String convertedFromLeadId;
    private LocalDateTime convertedDate;

    // Address - Mailing
    private String mailingStreet;
    private String mailingCity;
    private String mailingState;
    private String mailingPostalCode;
    private String mailingCountry;

    // Address - Other
    private String otherStreet;
    private String otherCity;
    private String otherState;
    private String otherPostalCode;
    private String otherCountry;

    // Additional
    private String description;
    private String assistantName;
    private String assistantPhone;
    private List<String> tags;

    // Owner
    private String ownerId;
    private String ownerName;

    // Engagement
    private LocalDateTime lastActivityDate;
    private LocalDateTime lastEmailDate;
    private LocalDateTime lastCallDate;
    private LocalDateTime lastMeetingDate;
    private Integer emailsSent;
    private Integer emailsReceived;
    private Integer callsMade;
    private Integer callsReceived;
    private Integer meetingsHeld;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;
}
