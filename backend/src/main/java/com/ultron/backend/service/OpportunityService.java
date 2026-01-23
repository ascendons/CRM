package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Account;
import com.ultron.backend.domain.entity.Contact;
import com.ultron.backend.domain.entity.Opportunity;
import com.ultron.backend.domain.enums.OpportunityStage;
import com.ultron.backend.dto.request.CreateOpportunityRequest;
import com.ultron.backend.dto.request.UpdateOpportunityRequest;
import com.ultron.backend.dto.response.OpportunityResponse;
import com.ultron.backend.dto.response.OpportunityStatistics;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.AccountRepository;
import com.ultron.backend.repository.ContactRepository;
import com.ultron.backend.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final OpportunityIdGeneratorService opportunityIdGenerator;
    private final UserService userService;

    /**
     * Create a new opportunity
     */
    public OpportunityResponse createOpportunity(CreateOpportunityRequest request, String createdByUserId) {
        log.info("Creating opportunity: {}", request.getOpportunityName());

        // Check if opportunity name already exists
        if (opportunityRepository.existsByOpportunityNameAndIsDeletedFalse(request.getOpportunityName())) {
            throw new UserAlreadyExistsException("Opportunity with name " + request.getOpportunityName() + " already exists");
        }

        String createdByName = userService.getUserFullName(createdByUserId);

        // Get account name
        String accountName = null;
        if (request.getAccountId() != null) {
            Optional<Account> account = accountRepository.findById(request.getAccountId());
            accountName = account.map(Account::getAccountName).orElse(null);
        }

        // Get contact name
        String contactName = null;
        if (request.getPrimaryContactId() != null) {
            Optional<Contact> contact = contactRepository.findById(request.getPrimaryContactId());
            contactName = contact.map(c -> c.getFirstName() + " " + c.getLastName()).orElse(null);
        }

        // Build opportunity entity
        Opportunity opportunity = Opportunity.builder()
                .opportunityId(opportunityIdGenerator.generateOpportunityId())
                .opportunityName(request.getOpportunityName())
                .stage(request.getStage())
                .amount(request.getAmount())
                .probability(request.getProbability())
                .expectedCloseDate(request.getExpectedCloseDate())
                .accountId(request.getAccountId())
                .accountName(accountName)
                .primaryContactId(request.getPrimaryContactId())
                .primaryContactName(contactName)
                .type(request.getType())
                .leadSource(request.getLeadSource())
                .campaignSource(request.getCampaignSource())
                .nextStep(request.getNextStep())
                .description(request.getDescription())
                .forecastAmount(request.getForecastAmount())
                .currency(request.getCurrency())
                .discountAmount(request.getDiscountAmount())
                .totalAmount(request.getTotalAmount())
                .products(request.getProducts())
                .services(request.getServices())
                .solutionOffered(request.getSolutionOffered())
                .competitors(request.getCompetitors())
                .competitiveAdvantage(request.getCompetitiveAdvantage())
                .decisionMaker(request.getDecisionMaker())
                .decisionCriteria(request.getDecisionCriteria())
                .budgetConfirmed(request.getBudgetConfirmed())
                .decisionTimeframe(request.getDecisionTimeframe())
                .deliveryStatus(request.getDeliveryStatus())
                .paymentTerms(request.getPaymentTerms())
                .tags(request.getTags())
                .notes(request.getNotes())
                .ownerId(createdByUserId)
                .ownerName(createdByName)
                .daysInStage(0)
                .totalActivities(0)
                .emailsSent(0)
                .callsMade(0)
                .meetingsHeld(0)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .createdByName(createdByName)
                .lastModifiedAt(LocalDateTime.now())
                .lastModifiedBy(createdByUserId)
                .lastModifiedByName(createdByName)
                .isDeleted(false)
                .build();

        // Set stage date based on current stage
        setStageDate(opportunity, request.getStage());

        Opportunity saved = opportunityRepository.save(opportunity);
        log.info("Opportunity created successfully with ID: {}", saved.getOpportunityId());

        return mapToResponse(saved);
    }

    /**
     * Get all opportunities
     */
    public List<OpportunityResponse> getAllOpportunities() {
        log.info("Fetching all opportunities");
        return opportunityRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get opportunity by ID
     */
    public OpportunityResponse getOpportunityById(String id) {
        log.info("Fetching opportunity with id: {}", id);
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        return mapToResponse(opportunity);
    }

    /**
     * Get opportunity by opportunityId
     */
    public OpportunityResponse getOpportunityByOpportunityId(String opportunityId) {
        log.info("Fetching opportunity with opportunityId: {}", opportunityId);
        Opportunity opportunity = opportunityRepository.findByOpportunityId(opportunityId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        return mapToResponse(opportunity);
    }

    /**
     * Get opportunities by account
     */
    public List<OpportunityResponse> getOpportunitiesByAccount(String accountId) {
        log.info("Fetching opportunities for account: {}", accountId);
        return opportunityRepository.findByAccountIdAndIsDeletedFalse(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get opportunities by contact
     */
    public List<OpportunityResponse> getOpportunitiesByContact(String contactId) {
        log.info("Fetching opportunities for contact: {}", contactId);
        return opportunityRepository.findByPrimaryContactIdAndIsDeletedFalse(contactId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get opportunities by stage
     */
    public List<OpportunityResponse> getOpportunitiesByStage(OpportunityStage stage) {
        log.info("Fetching opportunities for stage: {}", stage);
        return opportunityRepository.findByStageAndIsDeletedFalse(stage).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search opportunities
     */
    public List<OpportunityResponse> searchOpportunities(String searchTerm) {
        log.info("Searching opportunities with term: {}", searchTerm);
        return opportunityRepository.searchOpportunities(searchTerm).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update opportunity
     */
    public OpportunityResponse updateOpportunity(String id, UpdateOpportunityRequest request, String updatedByUserId) {
        log.info("Updating opportunity {} by user {}", id, updatedByUserId);

        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found with id: " + id));

        // Check name uniqueness if changed
        if (request.getOpportunityName() != null && !request.getOpportunityName().equals(opportunity.getOpportunityName())) {
            if (opportunityRepository.existsByOpportunityNameAndIsDeletedFalse(request.getOpportunityName())) {
                throw new UserAlreadyExistsException("Opportunity with name " + request.getOpportunityName() + " already exists");
            }
        }

        // Update fields
        if (request.getOpportunityName() != null) opportunity.setOpportunityName(request.getOpportunityName());

        // Handle stage change
        if (request.getStage() != null && request.getStage() != opportunity.getStage()) {
            opportunity.setStage(request.getStage());
            setStageDate(opportunity, request.getStage());
            opportunity.setDaysInStage(0);

            // Set actual close date if moving to closed stage
            if (request.getStage() == OpportunityStage.CLOSED_WON || request.getStage() == OpportunityStage.CLOSED_LOST) {
                opportunity.setActualCloseDate(request.getActualCloseDate());
                opportunity.setClosedDate(LocalDateTime.now());
            }
        }

        if (request.getAmount() != null) opportunity.setAmount(request.getAmount());
        if (request.getProbability() != null) opportunity.setProbability(request.getProbability());
        if (request.getExpectedCloseDate() != null) opportunity.setExpectedCloseDate(request.getExpectedCloseDate());
        if (request.getActualCloseDate() != null) opportunity.setActualCloseDate(request.getActualCloseDate());

        // Update account relationship
        if (request.getAccountId() != null) {
            opportunity.setAccountId(request.getAccountId());
            Optional<Account> account = accountRepository.findById(request.getAccountId());
            opportunity.setAccountName(account.map(Account::getAccountName).orElse(null));
        }

        // Update contact relationship
        if (request.getPrimaryContactId() != null) {
            opportunity.setPrimaryContactId(request.getPrimaryContactId());
            Optional<Contact> contact = contactRepository.findById(request.getPrimaryContactId());
            opportunity.setPrimaryContactName(contact.map(c -> c.getFirstName() + " " + c.getLastName()).orElse(null));
        }

        if (request.getType() != null) opportunity.setType(request.getType());
        if (request.getLeadSource() != null) opportunity.setLeadSource(request.getLeadSource());
        if (request.getCampaignSource() != null) opportunity.setCampaignSource(request.getCampaignSource());
        if (request.getNextStep() != null) opportunity.setNextStep(request.getNextStep());
        if (request.getDescription() != null) opportunity.setDescription(request.getDescription());

        // Financial
        if (request.getForecastAmount() != null) opportunity.setForecastAmount(request.getForecastAmount());
        if (request.getCurrency() != null) opportunity.setCurrency(request.getCurrency());
        if (request.getDiscountAmount() != null) opportunity.setDiscountAmount(request.getDiscountAmount());
        if (request.getTotalAmount() != null) opportunity.setTotalAmount(request.getTotalAmount());

        // Products/Services
        if (request.getProducts() != null) opportunity.setProducts(request.getProducts());
        if (request.getServices() != null) opportunity.setServices(request.getServices());
        if (request.getSolutionOffered() != null) opportunity.setSolutionOffered(request.getSolutionOffered());

        // Competition
        if (request.getCompetitors() != null) opportunity.setCompetitors(request.getCompetitors());
        if (request.getCompetitiveAdvantage() != null) opportunity.setCompetitiveAdvantage(request.getCompetitiveAdvantage());
        if (request.getLossReason() != null) opportunity.setLossReason(request.getLossReason());

        // Decision process
        if (request.getDecisionMaker() != null) opportunity.setDecisionMaker(request.getDecisionMaker());
        if (request.getDecisionCriteria() != null) opportunity.setDecisionCriteria(request.getDecisionCriteria());
        if (request.getBudgetConfirmed() != null) opportunity.setBudgetConfirmed(request.getBudgetConfirmed());
        if (request.getDecisionTimeframe() != null) opportunity.setDecisionTimeframe(request.getDecisionTimeframe());

        // Additional
        if (request.getDeliveryStatus() != null) opportunity.setDeliveryStatus(request.getDeliveryStatus());
        if (request.getPaymentTerms() != null) opportunity.setPaymentTerms(request.getPaymentTerms());
        if (request.getTags() != null) opportunity.setTags(request.getTags());
        if (request.getNotes() != null) opportunity.setNotes(request.getNotes());

        // Update system fields
        String updatedByName = userService.getUserFullName(updatedByUserId);
        opportunity.setLastModifiedAt(LocalDateTime.now());
        opportunity.setLastModifiedBy(updatedByUserId);
        opportunity.setLastModifiedByName(updatedByName);

        Opportunity updated = opportunityRepository.save(opportunity);
        log.info("Opportunity {} updated successfully", id);

        return mapToResponse(updated);
    }

    /**
     * Delete opportunity (soft delete)
     */
    public void deleteOpportunity(String id, String deletedByUserId) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));

        opportunity.setIsDeleted(true);
        opportunity.setDeletedAt(LocalDateTime.now());
        opportunity.setDeletedBy(deletedByUserId);

        opportunityRepository.save(opportunity);
        log.info("Opportunity {} soft deleted by user {}", id, deletedByUserId);
    }

    /**
     * Get opportunity count
     */
    public long getOpportunityCount() {
        return opportunityRepository.countByIsDeletedFalse();
    }

    /**
     * Get opportunity statistics
     */
    public OpportunityStatistics getStatistics() {
        log.info("Calculating opportunity statistics");

        List<Opportunity> allOpportunities = opportunityRepository.findByIsDeletedFalse();
        List<Opportunity> closedOpps = opportunityRepository.findClosedOpportunities();
        List<Opportunity> openOpps = opportunityRepository.findOpenOpportunities();

        long prospecting = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.PROSPECTING);
        long qualification = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.QUALIFICATION);
        long needsAnalysis = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.NEEDS_ANALYSIS);
        long proposal = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.PROPOSAL);
        long negotiation = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.NEGOTIATION);
        long won = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.CLOSED_WON);
        long lost = opportunityRepository.countByStageAndIsDeletedFalse(OpportunityStage.CLOSED_LOST);

        BigDecimal totalValue = allOpportunities.stream()
                .map(Opportunity::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal wonValue = allOpportunities.stream()
                .filter(o -> o.getStage() == OpportunityStage.CLOSED_WON)
                .map(Opportunity::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal lostValue = allOpportunities.stream()
                .filter(o -> o.getStage() == OpportunityStage.CLOSED_LOST)
                .map(Opportunity::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pipelineValue = openOpps.stream()
                .map(Opportunity::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal weightedValue = openOpps.stream()
                .filter(o -> o.getAmount() != null && o.getProbability() != null)
                .map(o -> o.getAmount().multiply(BigDecimal.valueOf(o.getProbability())).divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double winRate = (won + lost) > 0 ? (won * 100.0) / (won + lost) : 0.0;
        double avgDealSize = !allOpportunities.isEmpty() ? totalValue.divide(BigDecimal.valueOf(allOpportunities.size()), RoundingMode.HALF_UP).doubleValue() : 0.0;

        // Calculate average close days for won deals
        double avgCloseDays = closedOpps.stream()
                .filter(o -> o.getCreatedAt() != null && o.getClosedDate() != null)
                .mapToLong(o -> ChronoUnit.DAYS.between(o.getCreatedAt(), o.getClosedDate()))
                .average()
                .orElse(0.0);

        return OpportunityStatistics.builder()
                .totalOpportunities(allOpportunities.size())
                .openOpportunities(openOpps.size())
                .closedOpportunities(closedOpps.size())
                .prospectingCount(prospecting)
                .qualificationCount(qualification)
                .needsAnalysisCount(needsAnalysis)
                .proposalCount(proposal)
                .negotiationCount(negotiation)
                .wonCount(won)
                .lostCount(lost)
                .totalValue(totalValue)
                .wonValue(wonValue)
                .lostValue(lostValue)
                .pipelineValue(pipelineValue)
                .weightedValue(weightedValue)
                .winRate(winRate)
                .averageDealSize(avgDealSize)
                .averageCloseDays(avgCloseDays)
                .build();
    }

    /**
     * Map Opportunity entity to OpportunityResponse DTO
     */
    private OpportunityResponse mapToResponse(Opportunity opportunity) {
        return OpportunityResponse.builder()
                .id(opportunity.getId())
                .opportunityId(opportunity.getOpportunityId())
                .opportunityName(opportunity.getOpportunityName())
                .stage(opportunity.getStage())
                .amount(opportunity.getAmount())
                .probability(opportunity.getProbability())
                .expectedCloseDate(opportunity.getExpectedCloseDate())
                .actualCloseDate(opportunity.getActualCloseDate())
                .accountId(opportunity.getAccountId())
                .accountName(opportunity.getAccountName())
                .primaryContactId(opportunity.getPrimaryContactId())
                .primaryContactName(opportunity.getPrimaryContactName())
                .convertedFromLeadId(opportunity.getConvertedFromLeadId())
                .convertedDate(opportunity.getConvertedDate())
                .type(opportunity.getType())
                .leadSource(opportunity.getLeadSource())
                .campaignSource(opportunity.getCampaignSource())
                .nextStep(opportunity.getNextStep())
                .description(opportunity.getDescription())
                .forecastAmount(opportunity.getForecastAmount())
                .currency(opportunity.getCurrency())
                .discountAmount(opportunity.getDiscountAmount())
                .totalAmount(opportunity.getTotalAmount())
                .products(opportunity.getProducts())
                .services(opportunity.getServices())
                .solutionOffered(opportunity.getSolutionOffered())
                .competitors(opportunity.getCompetitors())
                .competitiveAdvantage(opportunity.getCompetitiveAdvantage())
                .lossReason(opportunity.getLossReason())
                .daysInStage(opportunity.getDaysInStage())
                .lastActivityDate(opportunity.getLastActivityDate())
                .totalActivities(opportunity.getTotalActivities())
                .emailsSent(opportunity.getEmailsSent())
                .callsMade(opportunity.getCallsMade())
                .meetingsHeld(opportunity.getMeetingsHeld())
                .decisionMaker(opportunity.getDecisionMaker())
                .decisionCriteria(opportunity.getDecisionCriteria())
                .budgetConfirmed(opportunity.getBudgetConfirmed())
                .decisionTimeframe(opportunity.getDecisionTimeframe())
                .ownerId(opportunity.getOwnerId())
                .ownerName(opportunity.getOwnerName())
                .teamMembers(opportunity.getTeamMembers())
                .deliveryStatus(opportunity.getDeliveryStatus())
                .paymentTerms(opportunity.getPaymentTerms())
                .tags(opportunity.getTags())
                .notes(opportunity.getNotes())
                .createdAt(opportunity.getCreatedAt())
                .createdBy(opportunity.getCreatedBy())
                .createdByName(opportunity.getCreatedByName())
                .lastModifiedAt(opportunity.getLastModifiedAt())
                .lastModifiedBy(opportunity.getLastModifiedBy())
                .lastModifiedByName(opportunity.getLastModifiedByName())
                .prospectingDate(opportunity.getProspectingDate())
                .qualificationDate(opportunity.getQualificationDate())
                .needsAnalysisDate(opportunity.getNeedsAnalysisDate())
                .proposalDate(opportunity.getProposalDate())
                .negotiationDate(opportunity.getNegotiationDate())
                .closedDate(opportunity.getClosedDate())
                .build();
    }

    /**
     * Set stage date based on current stage
     */
    private void setStageDate(Opportunity opportunity, OpportunityStage stage) {
        LocalDateTime now = LocalDateTime.now();
        switch (stage) {
            case PROSPECTING:
                opportunity.setProspectingDate(now);
                break;
            case QUALIFICATION:
                opportunity.setQualificationDate(now);
                break;
            case NEEDS_ANALYSIS:
                opportunity.setNeedsAnalysisDate(now);
                break;
            case PROPOSAL:
                opportunity.setProposalDate(now);
                break;
            case NEGOTIATION:
                opportunity.setNegotiationDate(now);
                break;
            case CLOSED_WON:
            case CLOSED_LOST:
                opportunity.setClosedDate(now);
                break;
        }
    }
}
