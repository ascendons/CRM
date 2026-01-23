package com.ultron.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContactRequest {

    // Required fields
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    // Optional basic fields
    private String salutation;

    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone must be 10-15 digits")
    private String phone;

    private String mobilePhone;
    private String workPhone;
    private String homePhone;

    // Professional information
    private String jobTitle;
    private String department;
    private String reportsTo;
    private LocalDate birthdate;
    private Boolean emailOptOut;

    // Social & web
    private String linkedInProfile;
    private String twitterHandle;
    private String facebookProfile;
    private String website;
    private String skypeId;

    // Account relationship
    private String accountId;
    private Boolean isPrimaryContact;

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
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private String assistantName;
    private String assistantPhone;
    private List<String> tags;
}
