package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.enums.LeadStatus;
import com.ultron.backend.dto.request.CreateLeadRequest;
import com.ultron.backend.dto.request.UpdateLeadRequest;
import com.ultron.backend.dto.response.LeadResponse;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.LeadRepository;
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
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadIdGeneratorService leadIdGenerator;
    private final LeadScoringService scoringService;
    private final UserService userService;

    /**
     * Create a new lead
     */
    public LeadResponse createLead(CreateLeadRequest request, String createdByUserId) {
        log.info("Creating lead for email: {}", request.getEmail());

        // Check if email already exists
        if (leadRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new UserAlreadyExistsException("Lead with email " + request.getEmail() + " already exists");
        }

        // Build lead entity
        Lead lead = Lead.builder()
                .leadId(leadIdGenerator.generateLeadId())
                // Basic info
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .companyName(request.getCompanyName())
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

        log.info("Lead created successfully with ID: {}", savedLead.getLeadId());

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
     * Get lead by leadId (LEAD-YYYY-MM-XXXXX)
     */
    public Optional<LeadResponse> getLeadByLeadId(String leadId) {
        return leadRepository.findByLeadId(leadId)
                .filter(lead -> !lead.getIsDeleted())
                .map(this::mapToResponse);
    }

    /**
     * Get all leads
     */
    public List<LeadResponse> getAllLeads() {
        return leadRepository.findByIsDeletedFalse()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get leads by owner
     */
    public List<LeadResponse> getLeadsByOwner(String ownerId) {
        return leadRepository.findByLeadOwnerIdAndIsDeletedFalse(ownerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get leads by status
     */
    public List<LeadResponse> getLeadsByStatus(LeadStatus status) {
        return leadRepository.findByLeadStatusAndIsDeletedFalse(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search leads
     */
    public List<LeadResponse> searchLeads(String searchTerm) {
        return leadRepository.searchLeads(searchTerm)
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

        lead.setLeadStatus(newStatus);
        lead.setLastModifiedAt(LocalDateTime.now());
        lead.setLastModifiedBy(updatedByUserId);

        // Recalculate qualification score if moving to qualified
        if (newStatus == LeadStatus.QUALIFIED) {
            scoringService.calculateQualificationScore(lead);
        }

        Lead updated = leadRepository.save(lead);
        return mapToResponse(updated);
    }

    /**
     * Update lead information
     * Only updates fields that are provided (not null)
     */
    public LeadResponse updateLead(String id, UpdateLeadRequest request, String updatedByUserId) {
        log.info("Updating lead {} by user {}", id, updatedByUserId);

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));

        // Check if email is being updated and if it's unique
        if (request.getEmail() != null && !request.getEmail().equals(lead.getEmail())) {
            if (leadRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
                throw new UserAlreadyExistsException("Lead with email " + request.getEmail() + " already exists");
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
        if (request.getLeadOwnerId() != null) {
            lead.setLeadOwnerId(request.getLeadOwnerId());
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

        return mapToResponse(updatedLead);
    }

    /**
     * Delete lead (soft delete)
     */
    public void deleteLead(String id, String deletedByUserId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        lead.setIsDeleted(true);
        lead.setDeletedAt(LocalDateTime.now());
        lead.setDeletedBy(deletedByUserId);

        leadRepository.save(lead);
        log.info("Lead {} soft deleted by user {}", id, deletedByUserId);
    }

    /**
     * Convert lead to opportunity
     * Returns the converted lead with conversion details
     */
    public LeadResponse convertLead(String id, String convertedByUserId) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        // Validate lead can be converted
        if (lead.getLeadStatus() != LeadStatus.QUALIFIED) {
            throw new RuntimeException("Only qualified leads can be converted");
        }

        if (lead.getQualificationScore() == null || lead.getQualificationScore() < 60) {
            throw new RuntimeException("Lead qualification score must be at least 60 to convert");
        }

        // Update lead status
        lead.setLeadStatus(LeadStatus.CONVERTED);
        lead.setConvertedDate(LocalDateTime.now());
        lead.setLastModifiedAt(LocalDateTime.now());
        lead.setLastModifiedBy(convertedByUserId);

        // TODO: Create Opportunity, Contact, Account entities
        // For now, just mark as converted
        // lead.setConvertedToOpportunityId(opportunityId);
        // lead.setConvertedToContactId(contactId);
        // lead.setConvertedToAccountId(accountId);

        Lead converted = leadRepository.save(lead);
        log.info("Lead {} converted to opportunity by user {}", id, convertedByUserId);

        return mapToResponse(converted);
    }

    /**
     * Get statistics
     */
    public LeadStatistics getStatistics() {
        long totalLeads = leadRepository.count();
        long newLeads = leadRepository.countByLeadStatusAndIsDeletedFalse(LeadStatus.NEW);
        long contactedLeads = leadRepository.countByLeadStatusAndIsDeletedFalse(LeadStatus.CONTACTED);
        long qualifiedLeads = leadRepository.countByLeadStatusAndIsDeletedFalse(LeadStatus.QUALIFIED);
        long convertedLeads = leadRepository.countByLeadStatusAndIsDeletedFalse(LeadStatus.CONVERTED);

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
