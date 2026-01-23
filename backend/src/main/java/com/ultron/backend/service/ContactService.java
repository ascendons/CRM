package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Account;
import com.ultron.backend.domain.entity.Contact;
import com.ultron.backend.dto.request.CreateContactRequest;
import com.ultron.backend.dto.request.UpdateContactRequest;
import com.ultron.backend.dto.response.ContactResponse;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.AccountRepository;
import com.ultron.backend.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final ContactIdGeneratorService contactIdGenerator;
    private final UserService userService;

    /**
     * Create a new contact
     */
    public ContactResponse createContact(CreateContactRequest request, String createdByUserId) {
        log.info("Creating contact for email: {}", request.getEmail());

        // Check if email already exists
        if (contactRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new UserAlreadyExistsException("Contact with email " + request.getEmail() + " already exists");
        }

        // Get user info
        String createdByName = userService.getUserFullName(createdByUserId);

        // Get account name if accountId provided
        String accountName = null;
        if (request.getAccountId() != null) {
            Optional<Account> account = accountRepository.findById(request.getAccountId());
            accountName = account.map(Account::getAccountName).orElse(null);
        }

        // Build contact entity
        Contact contact = Contact.builder()
                .contactId(contactIdGenerator.generateContactId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .salutation(request.getSalutation())
                .email(request.getEmail())
                .phone(request.getPhone())
                .mobilePhone(request.getMobilePhone())
                .workPhone(request.getWorkPhone())
                .homePhone(request.getHomePhone())
                .jobTitle(request.getJobTitle())
                .department(request.getDepartment())
                .reportsTo(request.getReportsTo())
                .birthdate(request.getBirthdate())
                .emailOptOut(request.getEmailOptOut())
                .linkedInProfile(request.getLinkedInProfile())
                .twitterHandle(request.getTwitterHandle())
                .facebookProfile(request.getFacebookProfile())
                .website(request.getWebsite())
                .skypeId(request.getSkypeId())
                .accountId(request.getAccountId())
                .accountName(accountName)
                .isPrimaryContact(request.getIsPrimaryContact())
                .mailingStreet(request.getMailingStreet())
                .mailingCity(request.getMailingCity())
                .mailingState(request.getMailingState())
                .mailingPostalCode(request.getMailingPostalCode())
                .mailingCountry(request.getMailingCountry())
                .otherStreet(request.getOtherStreet())
                .otherCity(request.getOtherCity())
                .otherState(request.getOtherState())
                .otherPostalCode(request.getOtherPostalCode())
                .otherCountry(request.getOtherCountry())
                .description(request.getDescription())
                .assistantName(request.getAssistantName())
                .assistantPhone(request.getAssistantPhone())
                .tags(request.getTags())
                .ownerId(createdByUserId)
                .ownerName(createdByName)
                .emailsSent(0)
                .emailsReceived(0)
                .callsMade(0)
                .callsReceived(0)
                .meetingsHeld(0)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .createdByName(createdByName)
                .lastModifiedAt(LocalDateTime.now())
                .lastModifiedBy(createdByUserId)
                .lastModifiedByName(createdByName)
                .isDeleted(false)
                .build();

        Contact saved = contactRepository.save(contact);
        log.info("Contact created successfully with ID: {}", saved.getContactId());

        return mapToResponse(saved);
    }

    /**
     * Get all contacts
     */
    public List<ContactResponse> getAllContacts() {
        log.info("Fetching all contacts");
        return contactRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get contact by ID
     */
    public ContactResponse getContactById(String id) {
        log.info("Fetching contact with id: {}", id);
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        return mapToResponse(contact);
    }

    /**
     * Get contact by contactId
     */
    public ContactResponse getContactByContactId(String contactId) {
        log.info("Fetching contact with contactId: {}", contactId);
        Contact contact = contactRepository.findByContactId(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        return mapToResponse(contact);
    }

    /**
     * Get contacts by account
     */
    public List<ContactResponse> getContactsByAccount(String accountId) {
        log.info("Fetching contacts for account: {}", accountId);
        return contactRepository.findByAccountIdAndIsDeletedFalse(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search contacts
     */
    public List<ContactResponse> searchContacts(String searchTerm) {
        log.info("Searching contacts with term: {}", searchTerm);
        return contactRepository.searchContacts(searchTerm).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update contact
     */
    public ContactResponse updateContact(String id, UpdateContactRequest request, String updatedByUserId) {
        log.info("Updating contact {} by user {}", id, updatedByUserId);

        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with id: " + id));

        // Check email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(contact.getEmail())) {
            if (contactRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
                throw new UserAlreadyExistsException("Contact with email " + request.getEmail() + " already exists");
            }
        }

        // Update fields
        if (request.getFirstName() != null) contact.setFirstName(request.getFirstName());
        if (request.getLastName() != null) contact.setLastName(request.getLastName());
        if (request.getSalutation() != null) contact.setSalutation(request.getSalutation());
        if (request.getEmail() != null) contact.setEmail(request.getEmail());
        if (request.getPhone() != null) contact.setPhone(request.getPhone());
        if (request.getMobilePhone() != null) contact.setMobilePhone(request.getMobilePhone());
        if (request.getWorkPhone() != null) contact.setWorkPhone(request.getWorkPhone());
        if (request.getHomePhone() != null) contact.setHomePhone(request.getHomePhone());
        if (request.getJobTitle() != null) contact.setJobTitle(request.getJobTitle());
        if (request.getDepartment() != null) contact.setDepartment(request.getDepartment());
        if (request.getReportsTo() != null) contact.setReportsTo(request.getReportsTo());
        if (request.getBirthdate() != null) contact.setBirthdate(request.getBirthdate());
        if (request.getEmailOptOut() != null) contact.setEmailOptOut(request.getEmailOptOut());
        if (request.getLinkedInProfile() != null) contact.setLinkedInProfile(request.getLinkedInProfile());
        if (request.getTwitterHandle() != null) contact.setTwitterHandle(request.getTwitterHandle());
        if (request.getFacebookProfile() != null) contact.setFacebookProfile(request.getFacebookProfile());
        if (request.getWebsite() != null) contact.setWebsite(request.getWebsite());
        if (request.getSkypeId() != null) contact.setSkypeId(request.getSkypeId());

        // Update account relationship
        if (request.getAccountId() != null) {
            contact.setAccountId(request.getAccountId());
            Optional<Account> account = accountRepository.findById(request.getAccountId());
            contact.setAccountName(account.map(Account::getAccountName).orElse(null));
        }
        if (request.getIsPrimaryContact() != null) contact.setIsPrimaryContact(request.getIsPrimaryContact());

        // Update addresses
        if (request.getMailingStreet() != null) contact.setMailingStreet(request.getMailingStreet());
        if (request.getMailingCity() != null) contact.setMailingCity(request.getMailingCity());
        if (request.getMailingState() != null) contact.setMailingState(request.getMailingState());
        if (request.getMailingPostalCode() != null) contact.setMailingPostalCode(request.getMailingPostalCode());
        if (request.getMailingCountry() != null) contact.setMailingCountry(request.getMailingCountry());
        if (request.getOtherStreet() != null) contact.setOtherStreet(request.getOtherStreet());
        if (request.getOtherCity() != null) contact.setOtherCity(request.getOtherCity());
        if (request.getOtherState() != null) contact.setOtherState(request.getOtherState());
        if (request.getOtherPostalCode() != null) contact.setOtherPostalCode(request.getOtherPostalCode());
        if (request.getOtherCountry() != null) contact.setOtherCountry(request.getOtherCountry());

        // Update additional
        if (request.getDescription() != null) contact.setDescription(request.getDescription());
        if (request.getAssistantName() != null) contact.setAssistantName(request.getAssistantName());
        if (request.getAssistantPhone() != null) contact.setAssistantPhone(request.getAssistantPhone());
        if (request.getTags() != null) contact.setTags(request.getTags());

        // Update system fields
        String updatedByName = userService.getUserFullName(updatedByUserId);
        contact.setLastModifiedAt(LocalDateTime.now());
        contact.setLastModifiedBy(updatedByUserId);
        contact.setLastModifiedByName(updatedByName);

        Contact updated = contactRepository.save(contact);
        log.info("Contact {} updated successfully", id);

        return mapToResponse(updated);
    }

    /**
     * Delete contact (soft delete)
     */
    public void deleteContact(String id, String deletedByUserId) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found"));

        contact.setIsDeleted(true);
        contact.setDeletedAt(LocalDateTime.now());
        contact.setDeletedBy(deletedByUserId);

        contactRepository.save(contact);
        log.info("Contact {} soft deleted by user {}", id, deletedByUserId);
    }

    /**
     * Get contact count
     */
    public long getContactCount() {
        return contactRepository.countByIsDeletedFalse();
    }

    /**
     * Map Contact entity to ContactResponse DTO
     */
    private ContactResponse mapToResponse(Contact contact) {
        return ContactResponse.builder()
                .id(contact.getId())
                .contactId(contact.getContactId())
                .firstName(contact.getFirstName())
                .lastName(contact.getLastName())
                .salutation(contact.getSalutation())
                .email(contact.getEmail())
                .phone(contact.getPhone())
                .mobilePhone(contact.getMobilePhone())
                .workPhone(contact.getWorkPhone())
                .homePhone(contact.getHomePhone())
                .fax(contact.getFax())
                .jobTitle(contact.getJobTitle())
                .department(contact.getDepartment())
                .reportsTo(contact.getReportsTo())
                .birthdate(contact.getBirthdate())
                .emailOptOut(contact.getEmailOptOut())
                .linkedInProfile(contact.getLinkedInProfile())
                .twitterHandle(contact.getTwitterHandle())
                .facebookProfile(contact.getFacebookProfile())
                .website(contact.getWebsite())
                .skypeId(contact.getSkypeId())
                .accountId(contact.getAccountId())
                .accountName(contact.getAccountName())
                .isPrimaryContact(contact.getIsPrimaryContact())
                .convertedFromLeadId(contact.getConvertedFromLeadId())
                .convertedDate(contact.getConvertedDate())
                .mailingStreet(contact.getMailingStreet())
                .mailingCity(contact.getMailingCity())
                .mailingState(contact.getMailingState())
                .mailingPostalCode(contact.getMailingPostalCode())
                .mailingCountry(contact.getMailingCountry())
                .otherStreet(contact.getOtherStreet())
                .otherCity(contact.getOtherCity())
                .otherState(contact.getOtherState())
                .otherPostalCode(contact.getOtherPostalCode())
                .otherCountry(contact.getOtherCountry())
                .description(contact.getDescription())
                .assistantName(contact.getAssistantName())
                .assistantPhone(contact.getAssistantPhone())
                .tags(contact.getTags())
                .ownerId(contact.getOwnerId())
                .ownerName(contact.getOwnerName())
                .lastActivityDate(contact.getLastActivityDate())
                .lastEmailDate(contact.getLastEmailDate())
                .lastCallDate(contact.getLastCallDate())
                .lastMeetingDate(contact.getLastMeetingDate())
                .emailsSent(contact.getEmailsSent())
                .emailsReceived(contact.getEmailsReceived())
                .callsMade(contact.getCallsMade())
                .callsReceived(contact.getCallsReceived())
                .meetingsHeld(contact.getMeetingsHeld())
                .createdAt(contact.getCreatedAt())
                .createdBy(contact.getCreatedBy())
                .createdByName(contact.getCreatedByName())
                .lastModifiedAt(contact.getLastModifiedAt())
                .lastModifiedBy(contact.getLastModifiedBy())
                .lastModifiedByName(contact.getLastModifiedByName())
                .build();
    }
}
