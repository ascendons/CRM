package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Account;
import com.ultron.backend.domain.entity.Contact;
import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.entity.Opportunity;
import com.ultron.backend.domain.enums.LeadStatus;
import com.ultron.backend.domain.enums.OpportunityStage;
import com.ultron.backend.dto.request.CreateAccountRequest;
import com.ultron.backend.dto.request.CreateContactRequest;
import com.ultron.backend.dto.request.CreateLeadRequest;
import com.ultron.backend.dto.request.CreateOpportunityRequest;
import com.ultron.backend.dto.request.UpdateLeadRequest;
import com.ultron.backend.dto.response.AccountResponse;
import com.ultron.backend.dto.response.ContactResponse;
import com.ultron.backend.dto.response.LeadResponse;
import com.ultron.backend.dto.response.OpportunityResponse;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.AccountRepository;
import com.ultron.backend.repository.ContactRepository;
import com.ultron.backend.repository.LeadRepository;
import com.ultron.backend.repository.OpportunityRepository;
import com.ultron.backend.repository.ProposalRepository;
import com.ultron.backend.repository.ActivityRepository;
import com.ultron.backend.event.LeadCreatedEvent;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.entity.Activity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadService extends BaseTenantService {

    private final LeadRepository leadRepository;
    private final LeadIdGeneratorService leadIdGenerator;
    private final LeadScoringService scoringService;
    private final UserService userService;
    private final ContactService contactService;
    private final AccountService accountService;
    private final OpportunityService opportunityService;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;
    private final ProposalRepository proposalRepository;
    private final ActivityRepository activityRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    /**
     * Create a new lead
     */
    public LeadResponse createLead(CreateLeadRequest request, String createdByUserId) {
        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        log.info("[Tenant: {}] Creating lead for email: {}", tenantId, request.getEmail());

        // Check if email already exists within this tenant
        if (leadRepository.existsByEmailAndTenantIdAndIsDeletedFalse(request.getEmail(), tenantId)) {
            throw new UserAlreadyExistsException("Lead with email " + request.getEmail() + " already exists in your organization");
        }

        // Build lead entity
        Lead lead = Lead.builder()
                .leadId(leadIdGenerator.generateLeadId())
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
                // Basic info
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .companyName(request.getCompanyName())
                .gstNumber(request.getGstNumber())
                // Contact details
                .jobTitle(request.getJobTitle())
                .department(request.getDepartment())
                .mobilePhone(request.getMobilePhone())
                .workPhone(request.getWorkPhone())
                .linkedInProfile(request.getLinkedInProfile())
                .website(request.getWebsite())
                // Company info
                .industry(request.getIndustry())
                .companySize(request.getCompanySize())
                .annualRevenue(request.getAnnualRevenue())
                .numberOfEmployees(request.getNumberOfEmployees())
                // Address
                .country(request.getCountry())
                .state(request.getState())
                .city(request.getCity())
                .streetAddress(request.getStreetAddress())
                .postalCode(request.getPostalCode())
                // Classification
                .leadSource(request.getLeadSource() != null ? request.getLeadSource() : com.ultron.backend.domain.enums.LeadSource.OTHER)
                .leadStatus(LeadStatus.NEW)
                .leadOwnerId(request.getLeadOwnerId() != null ? request.getLeadOwnerId() : createdByUserId)
                .expectedRevenue(request.getExpectedRevenue())
                .expectedCloseDate(request.getExpectedCloseDate())
                // Additional
                .description(request.getDescription())
                .tags(request.getTags())
                // System fields
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .lastModifiedAt(LocalDateTime.now())
                .lastModifiedBy(createdByUserId)
                .isDeleted(false)
                .build();

        // Calculate lead score
        scoringService.calculateLeadScore(lead);

        // Save to database
        Lead savedLead = leadRepository.save(lead);

        // Publish event for auto-assignment
        eventPublisher.publishEvent(new LeadCreatedEvent(this, savedLead));

        log.info("Lead created successfully with ID: {}", savedLead.getLeadId());

        // Log audit
        auditLogService.logAsync("LEAD", savedLead.getId(), savedLead.getFirstName() + " " + savedLead.getLastName(),
                "CREATE", "New lead created for " + savedLead.getCompanyName(),
                null, LeadStatus.NEW.toString(),
                createdByUserId, null);

        // P0 #3: Notify lead owner about new lead assignment
        if (savedLead.getLeadOwnerId() != null && !savedLead.getLeadOwnerId().equals(createdByUserId)) {
            try {
                String sourceInfo = savedLead.getLeadSource() != null ? " Source: " + savedLead.getLeadSource() : "";
                notificationService.createAndSendNotification(
                    savedLead.getLeadOwnerId(),
                    "New Lead: " + savedLead.getFirstName() + " " + savedLead.getLastName(),
                    "You have a new lead from " + savedLead.getCompanyName() + sourceInfo,
                    "LEAD_CREATED",
                    "/leads/" + savedLead.getId()
                );
                log.info("Notification sent for new lead: {}", savedLead.getLeadId());
            } catch (Exception e) {
                log.error("Failed to send notification for lead creation: {}", savedLead.getLeadId(), e);
            }
        }

        return mapToResponse(savedLead);
    }

    /**
     * Get lead by ID
     */
    public Optional<LeadResponse> getLeadById(String id) {
        return leadRepository.findById(id)
                .filter(lead -> !lead.getIsDeleted())
                .map(this::mapToResponse);
    }

    /**
     * Get lead by leadId (LEAD-YYYY-MM-XXXXX) within current tenant
     */
    public Optional<LeadResponse> getLeadByLeadId(String leadId) {
        String tenantId = getCurrentTenantId();
        return leadRepository.findByLeadIdAndTenantId(leadId, tenantId)
                .filter(lead -> !lead.getIsDeleted())
                .map(this::mapToResponse);
    }

    /**
     * Get all leads for current tenant
     */
    public List<LeadResponse> getAllLeads() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all leads", tenantId);
        return leadRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get leads by owner within current tenant
     */
    public List<LeadResponse> getLeadsByOwner(String ownerId) {
        String tenantId = getCurrentTenantId();
        return leadRepository.findByLeadOwnerIdAndTenantIdAndIsDeletedFalse(ownerId, tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get leads by status within current tenant
     */
    public List<LeadResponse> getLeadsByStatus(LeadStatus status) {
        String tenantId = getCurrentTenantId();
        return leadRepository.findByLeadStatusAndTenantIdAndIsDeletedFalse(status, tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search leads within current tenant
     */
    public List<LeadResponse> searchLeads(String searchTerm) {
        String tenantId = getCurrentTenantId();
        return leadRepository.searchLeadsByTenantId(searchTerm, tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update lead status
     */
    public LeadResponse updateLeadStatus(String id, LeadStatus newStatus, String updatedByUserId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(lead.getTenantId());

        LeadStatus oldStatus = lead.getLeadStatus();
        lead.setLeadStatus(newStatus);
        lead.setLastModifiedAt(LocalDateTime.now());
        lead.setLastModifiedBy(updatedByUserId);

        // Recalculate qualification score if moving to qualified
        if (newStatus == LeadStatus.QUALIFIED) {
            scoringService.calculateQualificationScore(lead);
        }

        Lead updated = leadRepository.save(lead);

        // Log audit
        auditLogService.logAsync("LEAD", updated.getId(), updated.getFirstName() + " " + updated.getLastName(),
                "STATUS_CHANGE", "Lead status updated to " + newStatus,
                oldStatus.toString(), newStatus.toString(),
                updatedByUserId, null);

        // P0 #4: Notify lead owner when lead is qualified (high priority)
        if (newStatus == LeadStatus.QUALIFIED && updated.getLeadOwnerId() != null) {
            try {
                String scoreInfo = updated.getQualificationScore() != null ? " Score: " + updated.getQualificationScore() : "";
                notificationService.createAndSendNotification(
                    updated.getLeadOwnerId(),
                    "⭐ Lead Qualified: " + updated.getFirstName() + " " + updated.getLastName(),
                    "Your lead from " + updated.getCompanyName() + " is now qualified" + scoreInfo,
                    "LEAD_QUALIFIED",
                    "/leads/" + updated.getId()
                );
                log.info("Notification sent for lead qualification: {}", updated.getLeadId());
            } catch (Exception e) {
                log.error("Failed to send notification for lead qualification: {}", updated.getLeadId(), e);
            }
        }

        return mapToResponse(updated);
    }

    /**
     * Update lead information
     * Only updates fields that are provided (not null)
     */
    public LeadResponse updateLead(String id, UpdateLeadRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating lead {} by user {}", tenantId, id, updatedByUserId);

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));

        // Validate tenant ownership
        validateResourceTenantOwnership(lead.getTenantId());

        // Check if email is being updated and if it's unique within tenant
        if (request.getEmail() != null && !request.getEmail().equals(lead.getEmail())) {
            if (leadRepository.existsByEmailAndTenantIdAndIsDeletedFalse(request.getEmail(), tenantId)) {
                throw new UserAlreadyExistsException("Lead with email " + request.getEmail() + " already exists in your organization");
            }
        }

        // Track if fields affecting score are updated
        boolean scoreRelevantFieldsUpdated = false;

        // Update basic information
        if (request.getFirstName() != null) {
            lead.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            lead.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            lead.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            lead.setPhone(request.getPhone());
        }
        if (request.getCompanyName() != null) {
            lead.setCompanyName(request.getCompanyName());
        }
        if (request.getGstNumber() != null) {
            lead.setGstNumber(request.getGstNumber());
        }

        // Update contact details
        if (request.getJobTitle() != null) {
            lead.setJobTitle(request.getJobTitle());
            scoreRelevantFieldsUpdated = true;
        }
        if (request.getDepartment() != null) {
            lead.setDepartment(request.getDepartment());
        }
        if (request.getMobilePhone() != null) {
            lead.setMobilePhone(request.getMobilePhone());
        }
        if (request.getWorkPhone() != null) {
            lead.setWorkPhone(request.getWorkPhone());
        }
        if (request.getLinkedInProfile() != null) {
            lead.setLinkedInProfile(request.getLinkedInProfile());
        }
        if (request.getWebsite() != null) {
            lead.setWebsite(request.getWebsite());
        }

        // Update company information
        if (request.getIndustry() != null) {
            lead.setIndustry(request.getIndustry());
            scoreRelevantFieldsUpdated = true;
        }
        if (request.getCompanySize() != null) {
            lead.setCompanySize(request.getCompanySize());
            scoreRelevantFieldsUpdated = true;
        }
        if (request.getAnnualRevenue() != null) {
            lead.setAnnualRevenue(request.getAnnualRevenue());
        }
        if (request.getNumberOfEmployees() != null) {
            lead.setNumberOfEmployees(request.getNumberOfEmployees());
        }

        // Update address information
        if (request.getCountry() != null) {
            lead.setCountry(request.getCountry());
        }
        if (request.getState() != null) {
            lead.setState(request.getState());
        }
        if (request.getCity() != null) {
            lead.setCity(request.getCity());
        }
        if (request.getStreetAddress() != null) {
            lead.setStreetAddress(request.getStreetAddress());
        }
        if (request.getPostalCode() != null) {
            lead.setPostalCode(request.getPostalCode());
        }

        // Update lead classification
        if (request.getLeadSource() != null) {
            lead.setLeadSource(request.getLeadSource());
        }
        if (request.getLeadStatus() != null) {
            lead.setLeadStatus(request.getLeadStatus());
        }

        // P1 #20: Handle lead owner reassignment with notification
        if (request.getLeadOwnerId() != null && !request.getLeadOwnerId().equals(lead.getLeadOwnerId())) {
            String oldOwnerId = lead.getLeadOwnerId();
            String newOwnerId = request.getLeadOwnerId();
            lead.setLeadOwnerId(newOwnerId);

            // Notify new owner (if different from updater)
            if (!newOwnerId.equals(updatedByUserId)) {
                try {
                    String scoreInfo = lead.getLeadScore() != null ? " Score: " + lead.getLeadScore() : "";
                    notificationService.createAndSendNotification(
                        newOwnerId,
                        "Lead Assigned to You: " + lead.getFirstName() + " " + lead.getLastName(),
                        "Lead from " + lead.getCompanyName() + " has been assigned to you" + scoreInfo,
                        "LEAD_REASSIGNED",
                        "/leads/" + lead.getId()
                    );
                    log.info("Notification sent for lead reassignment: {}", lead.getLeadId());
                } catch (Exception e) {
                    log.error("Failed to send notification for lead reassignment: {}", lead.getLeadId(), e);
                }
            }
        }
        if (request.getExpectedRevenue() != null) {
            lead.setExpectedRevenue(request.getExpectedRevenue());
        }
        if (request.getExpectedCloseDate() != null) {
            lead.setExpectedCloseDate(request.getExpectedCloseDate());
        }

        // Update BANT qualification
        if (request.getHasBudget() != null) {
            lead.setHasBudget(request.getHasBudget());
        }
        if (request.getBudgetAmount() != null) {
            lead.setBudgetAmount(request.getBudgetAmount());
        }
        if (request.getBudgetTimeframe() != null) {
            lead.setBudgetTimeframe(request.getBudgetTimeframe());
        }
        if (request.getIsDecisionMaker() != null) {
            lead.setIsDecisionMaker(request.getIsDecisionMaker());
        }
        if (request.getDecisionMakerName() != null) {
            lead.setDecisionMakerName(request.getDecisionMakerName());
        }
        if (request.getBusinessProblem() != null) {
            lead.setBusinessProblem(request.getBusinessProblem());
        }
        if (request.getPainPoints() != null) {
            lead.setPainPoints(request.getPainPoints());
        }
        if (request.getExpectedPurchaseDate() != null) {
            lead.setExpectedPurchaseDate(request.getExpectedPurchaseDate());
        }
        if (request.getUrgencyLevel() != null) {
            lead.setUrgencyLevel(request.getUrgencyLevel());
        }

        // Update additional information
        if (request.getDescription() != null) {
            lead.setDescription(request.getDescription());
        }
        if (request.getTags() != null) {
            lead.setTags(request.getTags());
        }

        // Recalculate lead score if relevant fields were updated
        if (scoreRelevantFieldsUpdated) {
            scoringService.calculateLeadScore(lead);
        }

        // Update system fields
        lead.setLastModifiedAt(LocalDateTime.now());
        lead.setLastModifiedBy(updatedByUserId);

        // Save and return
        Lead updatedLead = leadRepository.save(lead);
        log.info("Lead {} updated successfully", id);

        // Log audit
        auditLogService.logAsync("LEAD", updatedLead.getId(), updatedLead.getFirstName() + " " + updatedLead.getLastName(),
                "UPDATE", "Lead details updated for " + updatedLead.getEmail(),
                null, null,
                updatedByUserId, null);

        return mapToResponse(updatedLead);
    }

    /**
     * Delete lead (soft delete)
     */
    public void deleteLead(String id, String deletedByUserId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(lead.getTenantId());

        lead.setIsDeleted(true);
        lead.setDeletedAt(LocalDateTime.now());
        lead.setDeletedBy(deletedByUserId);

        leadRepository.save(lead);
        log.info("Lead {} soft deleted by user {}", id, deletedByUserId);

        // Log audit
        auditLogService.logAsync("LEAD", lead.getId(), lead.getFirstName() + " " + lead.getLastName(),
                "DELETE", "Lead records deleted",
                null, null,
                deletedByUserId, null);
    }

    /**
     * Convert lead to opportunity
     * Returns the converted lead with conversion details
     */
    public LeadResponse convertLead(String id, String convertedByUserId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(lead.getTenantId());

        // Validate lead can be converted
        if (lead.getLeadStatus() != LeadStatus.QUALIFIED && lead.getLeadStatus() != LeadStatus.NEGOTIATION) {
            throw new RuntimeException("Only qualified or negotiating leads can be converted");
        }

//        if (lead.getQualificationScore() == null || lead.getQualificationScore() < 60) {
//            throw new RuntimeException("Lead qualification score must be at least 60 to convert");
//        }

        // Create Account from lead company information
        log.info("Creating Account from Lead {}", lead.getLeadId());
        CreateAccountRequest accountRequest = CreateAccountRequest.builder()
                .accountName(lead.getCompanyName())
                .industry(lead.getIndustry())
                .companySize(lead.getCompanySize())
                .annualRevenue(lead.getAnnualRevenue())
                .numberOfEmployees(lead.getNumberOfEmployees())
                .website(lead.getWebsite())
                .billingStreet(lead.getStreetAddress())
                .billingCity(lead.getCity())
                .billingState(lead.getState())
                .billingPostalCode(lead.getPostalCode())
                .billingCountry(lead.getCountry())
                .description(lead.getDescription())
                .tags(lead.getTags())
                .build();

        AccountResponse account = accountService.createAccount(accountRequest, convertedByUserId);
        log.info("Account {} created from lead conversion", account.getAccountId());

        // Create Contact from lead personal information and link to Account
        log.info("Creating Contact from Lead {}", lead.getLeadId());
        CreateContactRequest contactRequest = CreateContactRequest.builder()
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .mobilePhone(lead.getMobilePhone())
                .workPhone(lead.getWorkPhone())
                .jobTitle(lead.getJobTitle())
                .department(lead.getDepartment())
                .linkedInProfile(lead.getLinkedInProfile())
                .website(lead.getWebsite())
                .accountId(account.getId())
                .isPrimaryContact(true)
                .mailingStreet(lead.getStreetAddress())
                .mailingCity(lead.getCity())
                .mailingState(lead.getState())
                .mailingPostalCode(lead.getPostalCode())
                .mailingCountry(lead.getCountry())
                .description(lead.getDescription())
                .tags(lead.getTags())
                .build();

        ContactResponse contact = contactService.createContact(contactRequest, convertedByUserId);
        log.info("Contact {} created from lead conversion", contact.getContactId());

        // Update Contact and Account to reference the original lead
        Contact contactEntity = contactRepository.findById(contact.getId())
                .orElseThrow(() -> new RuntimeException("Contact not found after creation"));
        contactEntity.setConvertedFromLeadId(lead.getId());
        contactEntity.setConvertedDate(LocalDateTime.now());
        contactRepository.save(contactEntity);

        Account accountEntity = accountRepository.findById(account.getId())
                .orElseThrow(() -> new RuntimeException("Account not found after creation"));
        accountEntity.setConvertedFromLeadId(lead.getId());
        accountEntity.setConvertedDate(LocalDateTime.now());
        accountRepository.save(accountEntity);

        log.info("Updated Contact and Account with lead reference: {}", lead.getLeadId());

        // Create Opportunity from lead
        log.info("Creating Opportunity from Lead {}", lead.getLeadId());
        CreateOpportunityRequest opportunityRequest = CreateOpportunityRequest.builder()
                .opportunityName(lead.getCompanyName() + " - " + lead.getFirstName() + " " + lead.getLastName())
                .stage(OpportunityStage.CLOSED_WON) // Converted leads are already won deals
                .accountId(account.getId())
                .primaryContactId(contact.getId())
                .amount(lead.getExpectedRevenue() != null ? lead.getExpectedRevenue() : BigDecimal.ZERO)
                .probability(100) // Won deals have 100% probability
                .expectedCloseDate(lead.getExpectedCloseDate() != null ? lead.getExpectedCloseDate() : LocalDate.now())
                .actualCloseDate(LocalDate.now()) // Set actual close date to today
                .leadSource(lead.getLeadSource() != null ? lead.getLeadSource().toString() : null)
                .description(lead.getDescription())
                .tags(lead.getTags())
                .build();

        OpportunityResponse opportunity = opportunityService.createOpportunity(opportunityRequest, convertedByUserId);
        log.info("Opportunity {} created from lead conversion", opportunity.getOpportunityId());

        // Update Opportunity to reference the original lead
        Opportunity opportunityEntity = opportunityRepository.findById(opportunity.getId())
                .orElseThrow(() -> new RuntimeException("Opportunity not found after creation"));
        opportunityEntity.setConvertedFromLeadId(lead.getId());
        opportunityEntity.setConvertedDate(LocalDateTime.now());
        opportunityRepository.save(opportunityEntity);

        // Update lead status and conversion references
        lead.setLeadStatus(LeadStatus.CONVERTED);
        lead.setConvertedDate(LocalDateTime.now());
        lead.setConvertedToContactId(contact.getId());
        lead.setConvertedToAccountId(account.getId());
        lead.setConvertedToOpportunityId(opportunity.getId());
        lead.setLastModifiedAt(LocalDateTime.now());
        lead.setLastModifiedBy(convertedByUserId);

        Lead converted = leadRepository.save(lead);
        log.info("Lead {} converted successfully - Contact: {}, Account: {}, Opportunity: {}",
                lead.getLeadId(), contact.getContactId(), account.getAccountId(), opportunity.getOpportunityId());

        // Migrate historical data (Proposals, Activities)
        migrateLeadDataToOpportunity(lead, accountEntity, contactEntity, opportunityEntity, convertedByUserId);

        // Log audit
        auditLogService.logAsync("LEAD", converted.getId(), converted.getFirstName() + " " + converted.getLastName(),
                "CONVERT", "Lead converted to Opportunity",
                LeadStatus.QUALIFIED.toString(), LeadStatus.CONVERTED.toString(),
                convertedByUserId, null);

        // P0 #5: Notify about successful lead conversion (major milestone!)
        if (converted.getLeadOwnerId() != null) {
            try {
                notificationService.createAndSendNotification(
                    convertedByUserId,
                    "🎉 Lead Converted: " + converted.getFirstName() + " " + converted.getLastName(),
                    "Lead has been converted to Opportunity, Account, and Contact. Opportunity: " + opportunity.getOpportunityName(),
                    "LEAD_CONVERTED",
                    "/opportunities/" + converted.getConvertedToOpportunityId()
                );
                log.info("Notification sent for lead conversion: {}", converted.getLeadId());
            } catch (Exception e) {
                log.error("Failed to send notification for lead conversion: {}", converted.getLeadId(), e);
            }
        }

        return mapToResponse(converted);
    }

    /**
     * Helper to migrate historical data from Lead to the resulting Opportunity/Account/Contact
     */
    private void migrateLeadDataToOpportunity(Lead lead, Account account, Contact contact, Opportunity opportunity, String userId) {
        String tenantId = lead.getTenantId();
        
        // 1. Migrate Proposals
        List<Proposal> proposals = proposalRepository.findBySourceAndSourceIdAndTenantIdAndIsDeletedFalse(
                ProposalSource.LEAD, lead.getId(), tenantId);
        
        if (!proposals.isEmpty()) {
            log.info("Migrating {} proposals from Lead {} to Opportunity {}", proposals.size(), lead.getLeadId(), opportunity.getOpportunityId());
            for (Proposal proposal : proposals) {
                // Keep Lead info
                proposal.setLeadId(lead.getId());
                proposal.setLeadName(lead.getFirstName() + " " + lead.getLastName());
                
                // Add new Linkages
                proposal.setOpportunityId(opportunity.getId());
                proposal.setOpportunityName(opportunity.getOpportunityName());
                proposal.setAccountId(account.getId());
                proposal.setAccountName(account.getAccountName());
                proposal.setContactId(contact.getId());
                proposal.setContactName(contact.getFirstName() + " " + contact.getLastName());
                
                // Keep source as Opportunity for primary context
                proposal.setSource(ProposalSource.OPPORTUNITY);
                proposal.setSourceId(opportunity.getId());
                proposal.setSourceName(opportunity.getOpportunityName());
                
                proposal.setLastModifiedAt(LocalDateTime.now());
                proposal.setLastModifiedBy(userId);
                proposal.setLastModifiedByName("System (Lead Conversion)");
                
                proposalRepository.save(proposal);
            }
        }

        // 2. Migrate Activities
        List<Activity> activities = activityRepository.findByLeadIdAndTenantIdAndIsDeletedFalse(lead.getId(), tenantId);
        if (!activities.isEmpty()) {
            log.info("Migrating {} activities from Lead {} to Opportunity {}", activities.size(), lead.getLeadId(), opportunity.getOpportunityId());
            for (Activity activity : activities) {
                activity.setOpportunityId(opportunity.getId());
                activity.setOpportunityName(opportunity.getOpportunityName());
                activity.setAccountId(account.getId());
                activity.setAccountName(account.getAccountName());
                activity.setContactId(contact.getId());
                activity.setContactName(contact.getFirstName() + " " + contact.getLastName());
                
                activity.setLastModifiedAt(LocalDateTime.now());
                activity.setLastModifiedBy(userId);
                
                activityRepository.save(activity);
            }
        }
    }

    /**
     * Mark a lead as lost and create a CLOSED_LOST opportunity for tracking
     */
    public LeadResponse loseLead(String id, String lossReason, String userId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(lead.getTenantId());

        // Create Account from lead company information
        log.info("Creating Account from lost Lead {}", lead.getLeadId());
        CreateAccountRequest accountRequest = CreateAccountRequest.builder()
                .accountName(lead.getCompanyName())
                .industry(lead.getIndustry())
                .companySize(lead.getCompanySize())
                .annualRevenue(lead.getAnnualRevenue())
                .numberOfEmployees(lead.getNumberOfEmployees())
                .website(lead.getWebsite())
                .billingStreet(lead.getStreetAddress())
                .billingCity(lead.getCity())
                .billingState(lead.getState())
                .billingPostalCode(lead.getPostalCode())
                .billingCountry(lead.getCountry())
                .description(lead.getDescription())
                .tags(lead.getTags())
                .build();

        AccountResponse account = accountService.createAccount(accountRequest, userId);
        Account accountEntity = accountRepository.findById(account.getId()).orElseThrow();

        // Create Contact from lead personal information
        log.info("Creating Contact from lost Lead {}", lead.getLeadId());
        CreateContactRequest contactRequest = CreateContactRequest.builder()
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .mobilePhone(lead.getMobilePhone())
                .workPhone(lead.getWorkPhone())
                .jobTitle(lead.getJobTitle())
                .department(lead.getDepartment())
                .linkedInProfile(lead.getLinkedInProfile())
                .website(lead.getWebsite())
                .accountId(account.getId())
                .isPrimaryContact(true)
                .mailingStreet(lead.getStreetAddress())
                .mailingCity(lead.getCity())
                .mailingState(lead.getState())
                .mailingPostalCode(lead.getPostalCode())
                .mailingCountry(lead.getCountry())
                .description(lead.getDescription())
                .tags(lead.getTags())
                .build();

        ContactResponse contact = contactService.createContact(contactRequest, userId);
        Contact contactEntity = contactRepository.findById(contact.getId()).orElseThrow();

        // Create CLOSED_LOST Opportunity
        log.info("Creating CLOSED_LOST Opportunity from lost Lead {}", lead.getLeadId());
        CreateOpportunityRequest opportunityRequest = CreateOpportunityRequest.builder()
                .opportunityName(lead.getCompanyName() + " - " + lead.getFirstName() + " " + lead.getLastName())
                .stage(OpportunityStage.CLOSED_LOST)
                .accountId(account.getId())
                .primaryContactId(contact.getId())
                .amount(lead.getExpectedRevenue() != null ? lead.getExpectedRevenue() : BigDecimal.ZERO)
                .probability(0)
                .expectedCloseDate(lead.getExpectedCloseDate() != null ? lead.getExpectedCloseDate() : LocalDate.now())
                .actualCloseDate(LocalDate.now())
                .leadSource(lead.getLeadSource() != null ? lead.getLeadSource().toString() : null)
                .description(lead.getDescription())
                .notes(lossReason)
                .tags(lead.getTags())
                .build();

        OpportunityResponse opportunity = opportunityService.createOpportunity(opportunityRequest, userId);

        // Update Opportunity with loss reason and lead reference
        Opportunity opportunityEntity = opportunityRepository.findById(opportunity.getId())
                .orElseThrow(() -> new RuntimeException("Opportunity not found after creation"));
        opportunityEntity.setConvertedFromLeadId(lead.getId());
        opportunityEntity.setConvertedDate(LocalDateTime.now());
        opportunityEntity.setLossReason(lossReason);
        opportunityRepository.save(opportunityEntity);

        // Update lead status
        lead.setLeadStatus(LeadStatus.LOST);
        lead.setConvertedToContactId(contact.getId());
        lead.setConvertedToAccountId(account.getId());
        lead.setConvertedToOpportunityId(opportunity.getId());
        lead.setLastModifiedAt(LocalDateTime.now());
        lead.setLastModifiedBy(userId);

        Lead lost = leadRepository.save(lead);
        log.info("Lead {} marked as lost - Opportunity: {}", lead.getLeadId(), opportunity.getOpportunityId());

        // Migrate historical data (Proposals, Activities)
        migrateLeadDataToOpportunity(lead, accountEntity, contactEntity, opportunityEntity, userId);

        // Log audit
        auditLogService.logAsync("LEAD", lost.getId(), lost.getFirstName() + " " + lost.getLastName(),
                "LOSE", "Lead marked as lost: " + lossReason,
                null, LeadStatus.LOST.toString(),
                userId, null);

        // P1 #18: Notify lead owner about lead loss
        if (lost.getLeadOwnerId() != null) {
            try {
                notificationService.createAndSendNotification(
                    lost.getLeadOwnerId(),
                    "Lead Lost: " + lost.getFirstName() + " " + lost.getLastName(),
                    "Lead from " + lost.getCompanyName() + " has been marked as lost. Reason: " + lossReason,
                    "LEAD_LOST",
                    "/leads/" + lost.getId()
                );
                log.info("Notification sent for lead loss: {}", lost.getLeadId());
            } catch (Exception e) {
                log.error("Failed to send notification for lead loss: {}", lost.getLeadId(), e);
            }
        }

        return mapToResponse(lost);
    }

    /**
     * Get statistics for current tenant
     */
    public LeadStatistics getStatistics() {
        String tenantId = getCurrentTenantId();

        long totalLeads = leadRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        long newLeads = leadRepository.countByLeadStatusAndTenantIdAndIsDeletedFalse(LeadStatus.NEW, tenantId);
        long contactedLeads = leadRepository.countByLeadStatusAndTenantIdAndIsDeletedFalse(LeadStatus.CONTACTED, tenantId);
        long qualifiedLeads = leadRepository.countByLeadStatusAndTenantIdAndIsDeletedFalse(LeadStatus.QUALIFIED, tenantId);
        long convertedLeads = leadRepository.countByLeadStatusAndTenantIdAndIsDeletedFalse(LeadStatus.CONVERTED, tenantId);

        return LeadStatistics.builder()
                .totalLeads(totalLeads)
                .newLeads(newLeads)
                .contactedLeads(contactedLeads)
                .qualifiedLeads(qualifiedLeads)
                .convertedLeads(convertedLeads)
                .build();
    }

    /**
     * Map Lead entity to LeadResponse DTO
     */
    private LeadResponse mapToResponse(Lead lead) {
        // Get owner name
        String ownerName = null;
        if (lead.getLeadOwnerId() != null) {
            ownerName = userService.findById(lead.getLeadOwnerId())
                    .map(user -> user.getFullName())
                    .orElse(null);
        }

        return LeadResponse.builder()
                .id(lead.getId())
                .leadId(lead.getLeadId())
                // Basic info
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .companyName(lead.getCompanyName())
                .gstNumber(lead.getGstNumber())
                // Contact details
                .jobTitle(lead.getJobTitle())
                .department(lead.getDepartment())
                .mobilePhone(lead.getMobilePhone())
                .workPhone(lead.getWorkPhone())
                .linkedInProfile(lead.getLinkedInProfile())
                .website(lead.getWebsite())
                // Company info
                .industry(lead.getIndustry())
                .companySize(lead.getCompanySize())
                .annualRevenue(lead.getAnnualRevenue())
                .numberOfEmployees(lead.getNumberOfEmployees())
                // Address
                .country(lead.getCountry())
                .state(lead.getState())
                .city(lead.getCity())
                .streetAddress(lead.getStreetAddress())
                .postalCode(lead.getPostalCode())
                // Classification
                .leadSource(lead.getLeadSource())
                .leadStatus(lead.getLeadStatus())
                .leadOwnerId(lead.getLeadOwnerId())
                .leadOwnerName(ownerName)
                .expectedRevenue(lead.getExpectedRevenue())
                .expectedCloseDate(lead.getExpectedCloseDate())
                // Additional
                .description(lead.getDescription())
                .tags(lead.getTags())
                // Scoring
                .leadScore(lead.getLeadScore())
                .leadGrade(lead.getLeadGrade())
                .demographicScore(lead.getDemographicScore())
                .behavioralScore(lead.getBehavioralScore())
                .qualificationScore(lead.getQualificationScore())
                // Conversion
                .convertedDate(lead.getConvertedDate())
                .convertedToOpportunityId(lead.getConvertedToOpportunityId())
                // Assignment
                .assignedUserId(lead.getAssignedUserId())
                .assignedUserName(lead.getAssignedUserName())
                .assignedAt(lead.getAssignedAt())
                // System fields
                .createdAt(lead.getCreatedAt())
                .createdBy(lead.getCreatedBy())
                .lastModifiedAt(lead.getLastModifiedAt())
                .lastModifiedBy(lead.getLastModifiedBy())
                .lastActivityDate(lead.getLastActivityDate())
                .build();
    }

    /**
     * Statistics inner class
     */
    @lombok.Data
    @lombok.Builder
    public static class LeadStatistics {
        private long totalLeads;
        private long newLeads;
        private long contactedLeads;
        private long qualifiedLeads;
        private long convertedLeads;
    }
}
