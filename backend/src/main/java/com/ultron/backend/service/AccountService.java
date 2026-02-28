package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Account;
import com.ultron.backend.dto.request.CreateAccountRequest;
import com.ultron.backend.dto.request.UpdateAccountRequest;
import com.ultron.backend.dto.response.AccountResponse;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

import static com.ultron.backend.config.CacheConfig.DASHBOARD_STATS_CACHE;
import static com.ultron.backend.config.CacheConfig.GROWTH_TRENDS_CACHE;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService extends BaseTenantService {

    private final AccountRepository accountRepository;
    private final AccountIdGeneratorService accountIdGenerator;
    private final UserService userService;

    /**
     * Create a new account
     * Evicts dashboard cache to refresh statistics
     */
    @Caching(evict = {
            @CacheEvict(value = DASHBOARD_STATS_CACHE, key = "#root.target.getCurrentTenantId()"),
            @CacheEvict(value = GROWTH_TRENDS_CACHE, allEntries = true)
    })
    public AccountResponse createAccount(CreateAccountRequest request, String createdByUserId) {
        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        log.info("[Tenant: {}] Creating account: {}", tenantId, request.getAccountName());

        // Check if account name already exists within this tenant
        if (accountRepository.existsByAccountNameAndTenantIdAndIsDeletedFalse(request.getAccountName(), tenantId)) {
            throw new UserAlreadyExistsException("Account with name " + request.getAccountName() + " already exists in your organization");
        }

        String createdByName = userService.getUserFullName(createdByUserId);

        String parentId = request.getParentAccountId();
        String parentName = request.getAccountName(); // Default to its own name

        if (parentId != null && !parentId.trim().isEmpty()) {
            parentName = accountRepository.findById(parentId)
                    .map(Account::getAccountName)
                    .orElse(request.getAccountName());
        } else {
            parentId = null; // Treat empty as null
        }

        // Build account entity
        Account account = Account.builder()
                .accountId(accountIdGenerator.generateAccountId())
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
                .accountName(request.getAccountName())
                .parentAccountId(parentId)
                .parentAccountName(parentName)
                .accountType(request.getAccountType())
                .industry(request.getIndustry())
                .companySize(request.getCompanySize())
                .annualRevenue(request.getAnnualRevenue())
                .numberOfEmployees(request.getNumberOfEmployees())
                .ownership(request.getOwnership())
                .phone(request.getPhone())
                .fax(request.getFax())
                .website(request.getWebsite())
                .email(request.getEmail())
                .billingStreet(request.getBillingStreet())
                .billingCity(request.getBillingCity())
                .billingState(request.getBillingState())
                .billingPostalCode(request.getBillingPostalCode())
                .billingCountry(request.getBillingCountry())
                .shippingStreet(request.getShippingStreet())
                .shippingCity(request.getShippingCity())
                .shippingState(request.getShippingState())
                .shippingPostalCode(request.getShippingPostalCode())
                .shippingCountry(request.getShippingCountry())
                .tickerSymbol(request.getTickerSymbol())
                .sicCode(request.getSicCode())
                .naicsCode(request.getNaicsCode())
                .dunsNumber(request.getDunsNumber())
                .taxId(request.getTaxId())
                .linkedInPage(request.getLinkedInPage())
                .twitterHandle(request.getTwitterHandle())
                .facebookPage(request.getFacebookPage())
                .paymentTerms(request.getPaymentTerms())
                .creditStatus(request.getCreditStatus())
                .creditLimit(request.getCreditLimit())
                .currency(request.getCurrency())
                .totalOpportunities(0)
                .wonOpportunities(0)
                .lostOpportunities(0)
                .totalRevenue(BigDecimal.ZERO)
                .lifetimeValue(BigDecimal.ZERO)
                .totalContacts(0)
                .ownerId(createdByUserId)
                .ownerName(createdByName)
                .accountStatus("Active")
                .description(request.getDescription())
                .rating(request.getRating())
                .tags(request.getTags())
                .notes(request.getNotes())
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .createdByName(createdByName)
                .lastModifiedAt(LocalDateTime.now())
                .lastModifiedBy(createdByUserId)
                .lastModifiedByName(createdByName)
                .isDeleted(false)
                .build();

        Account saved = accountRepository.save(account);
        log.info("Account created successfully with ID: {}", saved.getAccountId());

        return mapToResponse(saved);
    }

    /**
     * Get all accounts for current tenant
     */
    public List<AccountResponse> getAllAccounts() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all accounts", tenantId);
        return accountRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get account by ID
     */
    public AccountResponse getAccountById(String id) {
        log.info("Fetching account with id: {}", id);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(account.getTenantId());

        return mapToResponse(account);
    }

    /**
     * Get account by accountId (ACC-YYYY-MM-XXXXX) within current tenant
     */
    public AccountResponse getAccountByAccountId(String accountId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching account with accountId: {}", tenantId, accountId);
        Account account = accountRepository.findByAccountIdAndTenantId(accountId, tenantId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        return mapToResponse(account);
    }

    /**
     * Search accounts within current tenant
     */
    public List<AccountResponse> searchAccounts(String searchTerm) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Searching accounts with term: {}", tenantId, searchTerm);
        return accountRepository.searchAccountsByTenantId(searchTerm, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update account
     * Evicts dashboard cache to refresh statistics
     */
    @Caching(evict = {
            @CacheEvict(value = DASHBOARD_STATS_CACHE, key = "#root.target.getCurrentTenantId()"),
            @CacheEvict(value = GROWTH_TRENDS_CACHE, allEntries = true)
    })
    public AccountResponse updateAccount(String id, UpdateAccountRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating account {} by user {}", tenantId, id, updatedByUserId);

        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + id));

        // Validate tenant ownership
        validateResourceTenantOwnership(account.getTenantId());

        // Check name uniqueness if changed within tenant
        if (request.getAccountName() != null && !request.getAccountName().equals(account.getAccountName())) {
            if (accountRepository.existsByAccountNameAndTenantIdAndIsDeletedFalse(request.getAccountName(), tenantId)) {
                throw new UserAlreadyExistsException("Account with name " + request.getAccountName() + " already exists in your organization");
            }
        }

        // Update fields
        if (request.getAccountName() != null) {
            account.setAccountName(request.getAccountName());
            // If it is its own parent (parentAccountId is null), update the parentAccountName too
            if (account.getParentAccountId() == null) {
                account.setParentAccountName(request.getAccountName());
            }
        }
        
        if (request.getParentAccountId() != null) {
            String parentId = request.getParentAccountId();
            if (parentId.trim().isEmpty()) {
                account.setParentAccountId(null);
                account.setParentAccountName(account.getAccountName());
            } else {
                account.setParentAccountId(parentId);
                accountRepository.findById(parentId).ifPresent(p -> account.setParentAccountName(p.getAccountName()));
            }
        }

        if (request.getAccountType() != null) account.setAccountType(request.getAccountType());
        if (request.getIndustry() != null) account.setIndustry(request.getIndustry());
        if (request.getCompanySize() != null) account.setCompanySize(request.getCompanySize());
        if (request.getAnnualRevenue() != null) account.setAnnualRevenue(request.getAnnualRevenue());
        if (request.getNumberOfEmployees() != null) account.setNumberOfEmployees(request.getNumberOfEmployees());
        if (request.getOwnership() != null) account.setOwnership(request.getOwnership());
        if (request.getPhone() != null) account.setPhone(request.getPhone());
        if (request.getFax() != null) account.setFax(request.getFax());
        if (request.getWebsite() != null) account.setWebsite(request.getWebsite());
        if (request.getEmail() != null) account.setEmail(request.getEmail());

        // Update billing address
        if (request.getBillingStreet() != null) account.setBillingStreet(request.getBillingStreet());
        if (request.getBillingCity() != null) account.setBillingCity(request.getBillingCity());
        if (request.getBillingState() != null) account.setBillingState(request.getBillingState());
        if (request.getBillingPostalCode() != null) account.setBillingPostalCode(request.getBillingPostalCode());
        if (request.getBillingCountry() != null) account.setBillingCountry(request.getBillingCountry());

        // Update shipping address
        if (request.getShippingStreet() != null) account.setShippingStreet(request.getShippingStreet());
        if (request.getShippingCity() != null) account.setShippingCity(request.getShippingCity());
        if (request.getShippingState() != null) account.setShippingState(request.getShippingState());
        if (request.getShippingPostalCode() != null) account.setShippingPostalCode(request.getShippingPostalCode());
        if (request.getShippingCountry() != null) account.setShippingCountry(request.getShippingCountry());

        // Update business info
        if (request.getTickerSymbol() != null) account.setTickerSymbol(request.getTickerSymbol());
        if (request.getSicCode() != null) account.setSicCode(request.getSicCode());
        if (request.getNaicsCode() != null) account.setNaicsCode(request.getNaicsCode());
        if (request.getDunsNumber() != null) account.setDunsNumber(request.getDunsNumber());
        if (request.getTaxId() != null) account.setTaxId(request.getTaxId());

        // Update social
        if (request.getLinkedInPage() != null) account.setLinkedInPage(request.getLinkedInPage());
        if (request.getTwitterHandle() != null) account.setTwitterHandle(request.getTwitterHandle());
        if (request.getFacebookPage() != null) account.setFacebookPage(request.getFacebookPage());

        // Update financial
        if (request.getPaymentTerms() != null) account.setPaymentTerms(request.getPaymentTerms());
        if (request.getCreditStatus() != null) account.setCreditStatus(request.getCreditStatus());
        if (request.getCreditLimit() != null) account.setCreditLimit(request.getCreditLimit());
        if (request.getCurrency() != null) account.setCurrency(request.getCurrency());

        // Update additional
        if (request.getAccountStatus() != null) account.setAccountStatus(request.getAccountStatus());
        if (request.getDescription() != null) account.setDescription(request.getDescription());
        if (request.getRating() != null) account.setRating(request.getRating());
        if (request.getTags() != null) account.setTags(request.getTags());
        if (request.getNotes() != null) account.setNotes(request.getNotes());

        // Update system fields
        String updatedByName = userService.getUserFullName(updatedByUserId);
        account.setLastModifiedAt(LocalDateTime.now());
        account.setLastModifiedBy(updatedByUserId);
        account.setLastModifiedByName(updatedByName);

        Account updated = accountRepository.save(account);
        log.info("Account {} updated successfully", id);

        return mapToResponse(updated);
    }

    /**
     * Delete account (soft delete)
     * Evicts dashboard cache to refresh statistics
     */
    @Caching(evict = {
            @CacheEvict(value = DASHBOARD_STATS_CACHE, key = "#root.target.getCurrentTenantId()"),
            @CacheEvict(value = GROWTH_TRENDS_CACHE, allEntries = true)
    })
    public void deleteAccount(String id, String deletedByUserId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(account.getTenantId());

        account.setIsDeleted(true);
        account.setDeletedAt(LocalDateTime.now());
        account.setDeletedBy(deletedByUserId);

        accountRepository.save(account);
        log.info("Account {} soft deleted by user {}", id, deletedByUserId);
    }

    /**
     * Get account count for current tenant
     */
    public long getAccountCount() {
        String tenantId = getCurrentTenantId();
        return accountRepository.countByTenantIdAndIsDeletedFalse(tenantId);
    }

    /**
     * Get accounts by owner within current tenant
     */
    public List<AccountResponse> getAccountsByOwner(String ownerId) {
        String tenantId = getCurrentTenantId();
        return accountRepository.findByOwnerIdAndTenantIdAndIsDeletedFalse(ownerId, tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get accounts by status within current tenant
     */
    public List<AccountResponse> getAccountsByStatus(String status) {
        String tenantId = getCurrentTenantId();
        return accountRepository.findByAccountStatusAndTenantIdAndIsDeletedFalse(status, tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get statistics for current tenant
     */
    public AccountStatistics getStatistics() {
        String tenantId = getCurrentTenantId();

        long totalAccounts = accountRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        long activeAccounts = accountRepository.countByAccountStatusAndTenantIdAndIsDeletedFalse("Active", tenantId);
        long prospectAccounts = accountRepository.countByAccountStatusAndTenantIdAndIsDeletedFalse("Prospecting", tenantId);
        long customerAccounts = accountRepository.countByAccountStatusAndTenantIdAndIsDeletedFalse("Customer", tenantId);

        return AccountStatistics.builder()
                .totalAccounts(totalAccounts)
                .activeAccounts(activeAccounts)
                .prospectAccounts(prospectAccounts)
                .customerAccounts(customerAccounts)
                .build();
    }

    /**
     * Map Account entity to AccountResponse DTO
     */
    private AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountId(account.getAccountId())
                .accountName(account.getAccountName())
                .parentAccountId(account.getParentAccountId())
                .parentAccountName(account.getParentAccountName())
                .accountType(account.getAccountType())
                .industry(account.getIndustry())
                .companySize(account.getCompanySize())
                .annualRevenue(account.getAnnualRevenue())
                .numberOfEmployees(account.getNumberOfEmployees())
                .ownership(account.getOwnership())
                .phone(account.getPhone())
                .fax(account.getFax())
                .website(account.getWebsite())
                .email(account.getEmail())
                .billingStreet(account.getBillingStreet())
                .billingCity(account.getBillingCity())
                .billingState(account.getBillingState())
                .billingPostalCode(account.getBillingPostalCode())
                .billingCountry(account.getBillingCountry())
                .shippingStreet(account.getShippingStreet())
                .shippingCity(account.getShippingCity())
                .shippingState(account.getShippingState())
                .shippingPostalCode(account.getShippingPostalCode())
                .shippingCountry(account.getShippingCountry())
                .tickerSymbol(account.getTickerSymbol())
                .sicCode(account.getSicCode())
                .naicsCode(account.getNaicsCode())
                .dunsNumber(account.getDunsNumber())
                .taxId(account.getTaxId())
                .linkedInPage(account.getLinkedInPage())
                .twitterHandle(account.getTwitterHandle())
                .facebookPage(account.getFacebookPage())
                .primaryContactId(account.getPrimaryContactId())
                .primaryContactName(account.getPrimaryContactName())
                .convertedFromLeadId(account.getConvertedFromLeadId())
                .convertedDate(account.getConvertedDate())
                .paymentTerms(account.getPaymentTerms())
                .creditStatus(account.getCreditStatus())
                .creditLimit(account.getCreditLimit())
                .currency(account.getCurrency())
                .totalOpportunities(account.getTotalOpportunities())
                .wonOpportunities(account.getWonOpportunities())
                .lostOpportunities(account.getLostOpportunities())
                .totalRevenue(account.getTotalRevenue())
                .lifetimeValue(account.getLifetimeValue())
                .totalContacts(account.getTotalContacts())
                .ownerId(account.getOwnerId())
                .ownerName(account.getOwnerName())
                .lastActivityDate(account.getLastActivityDate())
                .lastPurchaseDate(account.getLastPurchaseDate())
                .lastContactDate(account.getLastContactDate())
                .accountStatus(account.getAccountStatus())
                .description(account.getDescription())
                .rating(account.getRating())
                .tags(account.getTags())
                .notes(account.getNotes())
                .createdAt(account.getCreatedAt())
                .createdBy(account.getCreatedBy())
                .createdByName(account.getCreatedByName())
                .lastModifiedAt(account.getLastModifiedAt())
                .lastModifiedBy(account.getLastModifiedBy())
                .lastModifiedByName(account.getLastModifiedByName())
                .build();
    }

    /**
     * Statistics inner class
     */
    @lombok.Data
    @lombok.Builder
    public static class AccountStatistics {
        private long totalAccounts;
        private long activeAccounts;
        private long prospectAccounts;
        private long customerAccounts;
    }
}
