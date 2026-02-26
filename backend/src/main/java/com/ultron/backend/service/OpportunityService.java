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
public class OpportunityService extends BaseTenantService {

    private final OpportunityRepository opportunityRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final OpportunityIdGeneratorService opportunityIdGenerator;
    private final UserService userService;
    private final NotificationService notificationService;

    /**
     * Create a new opportunity
     */
    public OpportunityResponse createOpportunity(CreateOpportunityRequest request, String createdByUserId) {
        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        log.info("[Tenant: {}] Creating opportunity: {}", tenantId, request.getOpportunityName());

        // Check if opportunity name already exists within this tenant
        if (opportunityRepository.existsByOpportunityNameAndTenantIdAndIsDeletedFalse(request.getOpportunityName(), tenantId)) {
            throw new UserAlreadyExistsException("Opportunity with name " + request.getOpportunityName() + " already exists in your organization");
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
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
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

        // Handle actual close date for closed stages
        if (request.getActualCloseDate() != null) {
            opportunity.setActualCloseDate(request.getActualCloseDate());
        }
        if (request.getStage() == OpportunityStage.CLOSED_WON || request.getStage() == OpportunityStage.CLOSED_LOST) {
            opportunity.setClosedDate(LocalDateTime.now());
        }

        Opportunity saved = opportunityRepository.save(opportunity);
        log.info("Opportunity created successfully with ID: {}", saved.getOpportunityId());

        // P0 #6: Notify opportunity owner about creation
        if (saved.getOwnerId() != null && !saved.getOwnerId().equals(createdByUserId)) {
            try {
                String amountInfo = saved.getAmount() != null ? " Amount: ₹" + saved.getAmount() : "";
                String closeInfo = saved.getExpectedCloseDate() != null ? " Expected close: " + saved.getExpectedCloseDate() : "";
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "New Opportunity: " + saved.getOpportunityName(),
                    "Opportunity created" + amountInfo + closeInfo,
                    "OPPORTUNITY_CREATED",
                    "/opportunities/" + saved.getId()
                );
                log.info("Notification sent for new opportunity: {}", saved.getOpportunityId());
            } catch (Exception e) {
                log.error("Failed to send notification for opportunity creation: {}", saved.getOpportunityId(), e);
            }
        }

        return mapToResponse(saved);
    }

    /**
     * Get all opportunities for current tenant
     */
    public List<OpportunityResponse> getAllOpportunities() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all opportunities", tenantId);
        return opportunityRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
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

        // Validate tenant ownership
        validateResourceTenantOwnership(opportunity.getTenantId());

        return mapToResponse(opportunity);
    }

    /**
     * Get opportunity by opportunityId (OPP-YYYY-MM-XXXXX) within current tenant
     */
    public OpportunityResponse getOpportunityByOpportunityId(String opportunityId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching opportunity with opportunityId: {}", tenantId, opportunityId);
        Opportunity opportunity = opportunityRepository.findByOpportunityIdAndTenantId(opportunityId, tenantId)
                .orElseThrow(() -> new RuntimeException("Opportunity not found"));
        return mapToResponse(opportunity);
    }

    /**
     * Get opportunities by account within current tenant
     */
    public List<OpportunityResponse> getOpportunitiesByAccount(String accountId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching opportunities for account: {}", tenantId, accountId);
        return opportunityRepository.findByAccountIdAndTenantIdAndIsDeletedFalse(accountId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get opportunities by contact within current tenant
     */
    public List<OpportunityResponse> getOpportunitiesByContact(String contactId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching opportunities for contact: {}", tenantId, contactId);
        return opportunityRepository.findByPrimaryContactIdAndTenantIdAndIsDeletedFalse(contactId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get opportunities by stage within current tenant
     */
    public List<OpportunityResponse> getOpportunitiesByStage(OpportunityStage stage) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching opportunities for stage: {}", tenantId, stage);
        return opportunityRepository.findByStageAndTenantIdAndIsDeletedFalse(stage, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search opportunities within current tenant
     */
    public List<OpportunityResponse> searchOpportunities(String searchTerm) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Searching opportunities with term: {}", tenantId, searchTerm);
        return opportunityRepository.searchOpportunitiesByTenantId(searchTerm, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update opportunity
     */
    public OpportunityResponse updateOpportunity(String id, UpdateOpportunityRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating opportunity {} by user {}", tenantId, id, updatedByUserId);

        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found with id: " + id));

        // Validate tenant ownership
        validateResourceTenantOwnership(opportunity.getTenantId());

        // Check name uniqueness if changed within tenant
        if (request.getOpportunityName() != null && !request.getOpportunityName().equals(opportunity.getOpportunityName())) {
            if (opportunityRepository.existsByOpportunityNameAndTenantIdAndIsDeletedFalse(request.getOpportunityName(), tenantId)) {
                throw new UserAlreadyExistsException("Opportunity with name " + request.getOpportunityName() + " already exists in your organization");
            }
        }

        // Update fields
        if (request.getOpportunityName() != null) opportunity.setOpportunityName(request.getOpportunityName());

        // Handle stage change with notifications
        OpportunityStage oldStage = opportunity.getStage();
        boolean stageChanged = false;
        if (request.getStage() != null && request.getStage() != oldStage) {
            stageChanged = true;
            OpportunityStage newStage = request.getStage();
            opportunity.setStage(newStage);
            setStageDate(opportunity, newStage);
            opportunity.setDaysInStage(0);

            // Set actual close date if moving to closed stage
            if (newStage == OpportunityStage.CLOSED_WON || newStage == OpportunityStage.CLOSED_LOST) {
                opportunity.setActualCloseDate(request.getActualCloseDate());
                opportunity.setClosedDate(LocalDateTime.now());
            }

            // P0 #8: Notify for CLOSED_WON (Celebration!)
            if (newStage == OpportunityStage.CLOSED_WON && opportunity.getOwnerId() != null) {
                try {
                    String amountInfo = opportunity.getAmount() != null ? " worth ₹" + opportunity.getAmount() : "";
                    String accountInfo = opportunity.getAccountName() != null ? " with " + opportunity.getAccountName() : "";
                    notificationService.createAndSendNotification(
                        opportunity.getOwnerId(),
                        "🎉 Opportunity Won! " + opportunity.getOpportunityName(),
                        "Congratulations! You closed the deal" + amountInfo + accountInfo,
                        "OPPORTUNITY_WON",
                        "/opportunities/" + opportunity.getId()
                    );
                    log.info("Notification sent for opportunity win: {}", opportunity.getOpportunityId());
                } catch (Exception e) {
                    log.error("Failed to send notification for opportunity win: {}", opportunity.getOpportunityId(), e);
                }
            }
            // P0 #9: Notify for CLOSED_LOST
            else if (newStage == OpportunityStage.CLOSED_LOST && opportunity.getOwnerId() != null) {
                try {
                    String amountInfo = opportunity.getAmount() != null ? " Amount: ₹" + opportunity.getAmount() : "";
                    String lossInfo = request.getLossReason() != null ? " Loss reason: " + request.getLossReason() : "";
                    notificationService.createAndSendNotification(
                        opportunity.getOwnerId(),
                        "Opportunity Lost: " + opportunity.getOpportunityName(),
                        "Opportunity marked as lost" + amountInfo + lossInfo,
                        "OPPORTUNITY_LOST",
                        "/opportunities/" + opportunity.getId()
                    );
                    log.info("Notification sent for opportunity loss: {}", opportunity.getOpportunityId());
                } catch (Exception e) {
                    log.error("Failed to send notification for opportunity loss: {}", opportunity.getOpportunityId(), e);
                }
            }
            // P0 #7: Notify for general stage changes (not closed)
            else if (opportunity.getOwnerId() != null) {
                try {
                    notificationService.createAndSendNotification(
                        opportunity.getOwnerId(),
                        "Opportunity Stage Updated: " + opportunity.getOpportunityName(),
                        "Moved from " + oldStage + " to " + newStage,
                        "OPPORTUNITY_STAGE_CHANGED",
                        "/opportunities/" + opportunity.getId()
                    );
                    log.info("Notification sent for opportunity stage change: {}", opportunity.getOpportunityId());
                } catch (Exception e) {
                    log.error("Failed to send notification for opportunity stage change: {}", opportunity.getOpportunityId(), e);
                }
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

        // Validate tenant ownership
        validateResourceTenantOwnership(opportunity.getTenantId());

        opportunity.setIsDeleted(true);
        opportunity.setDeletedAt(LocalDateTime.now());
        opportunity.setDeletedBy(deletedByUserId);

        opportunityRepository.save(opportunity);
        log.info("Opportunity {} soft deleted by user {}", id, deletedByUserId);
    }

    /**
     * Get opportunity count for current tenant
     */
    public long getOpportunityCount() {
        String tenantId = getCurrentTenantId();
        return opportunityRepository.countByTenantIdAndIsDeletedFalse(tenantId);
    }

    /**
     * Get opportunity statistics for current tenant
     */
    public OpportunityStatistics getStatistics() {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Calculating opportunity statistics", tenantId);

        List<Opportunity> allOpportunities = opportunityRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<Opportunity> closedOpps = opportunityRepository.findClosedOpportunitiesByTenantId(tenantId);
        List<Opportunity> openOpps = opportunityRepository.findOpenOpportunitiesByTenantId(tenantId);

        long prospecting = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.PROSPECTING, tenantId);
        long qualification = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.QUALIFICATION, tenantId);
        long needsAnalysis = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.NEEDS_ANALYSIS, tenantId);
        long proposal = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.PROPOSAL, tenantId);
        long negotiation = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.NEGOTIATION, tenantId);
        long won = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.CLOSED_WON, tenantId);
        long lost = opportunityRepository.countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage.CLOSED_LOST, tenantId);

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
