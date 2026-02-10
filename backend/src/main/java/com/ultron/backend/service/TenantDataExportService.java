package com.ultron.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ultron.backend.domain.entity.*;
import com.ultron.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Service for exporting all tenant data
 * Supports GDPR compliance and data portability requirements
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantDataExportService extends BaseTenantService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;
    private final ProductRepository productRepository;
    private final ProposalRepository proposalRepository;
    private final ActivityRepository activityRepository;
    private final AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .enable(SerializationFeature.INDENT_OUTPUT)
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    /**
     * Export all tenant data as JSON files in a ZIP archive
     */
    public byte[] exportAllData() throws IOException {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] EXPORT_ALL_DATA", tenantId);

        log.info("[Tenant: {}] Starting full data export", tenantId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(baos);

        try {
            // Export organization details
            exportOrganization(zos, tenantId);

            // Export all entity collections
            exportUsers(zos);
            exportLeads(zos);
            exportContacts(zos);
            exportAccounts(zos);
            exportOpportunities(zos);
            exportProducts(zos);
            exportProposals(zos);
            exportActivities(zos);
            exportAuditLogs(zos);

            // Add metadata file
            addMetadata(zos, tenantId);

            zos.close();

            log.info("[Tenant: {}] Data export completed successfully", tenantId);

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("[Tenant: {}] Data export failed", tenantId, e);
            throw new IOException("Failed to export tenant data", e);
        }
    }

    /**
     * Export specific entity type
     */
    public byte[] exportEntityData(String entityType) throws IOException {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] EXPORT_ENTITY_DATA: {}", tenantId, entityType);

        log.info("[Tenant: {}] Exporting entity: {}", tenantId, entityType);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(baos);

        try {
            switch (entityType.toUpperCase()) {
                case "USERS" -> exportUsers(zos);
                case "LEADS" -> exportLeads(zos);
                case "CONTACTS" -> exportContacts(zos);
                case "ACCOUNTS" -> exportAccounts(zos);
                case "OPPORTUNITIES" -> exportOpportunities(zos);
                case "PRODUCTS" -> exportProducts(zos);
                case "PROPOSALS" -> exportProposals(zos);
                case "ACTIVITIES" -> exportActivities(zos);
                case "AUDIT_LOGS" -> exportAuditLogs(zos);
                default -> throw new IllegalArgumentException("Unknown entity type: " + entityType);
            }

            addMetadata(zos, tenantId);
            zos.close();

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("[Tenant: {}] Entity export failed for: {}", tenantId, entityType, e);
            throw new IOException("Failed to export entity data", e);
        }
    }

    // Export methods for each entity

    private void exportOrganization(ZipOutputStream zos, String tenantId) throws IOException {
        Organization org = organizationRepository.findById(tenantId).orElse(null);
        if (org != null) {
            addJsonFile(zos, "organization.json", org);
        }
    }

    private void exportUsers(ZipOutputStream zos) throws IOException {
        List<User> users = userRepository.findAll();
        addJsonFile(zos, "users.json", users);
        log.info("Exported {} users", users.size());
    }

    private void exportLeads(ZipOutputStream zos) throws IOException {
        List<Lead> leads = leadRepository.findAll();
        addJsonFile(zos, "leads.json", leads);
        log.info("Exported {} leads", leads.size());
    }

    private void exportContacts(ZipOutputStream zos) throws IOException {
        List<Contact> contacts = contactRepository.findAll();
        addJsonFile(zos, "contacts.json", contacts);
        log.info("Exported {} contacts", contacts.size());
    }

    private void exportAccounts(ZipOutputStream zos) throws IOException {
        List<Account> accounts = accountRepository.findAll();
        addJsonFile(zos, "accounts.json", accounts);
        log.info("Exported {} accounts", accounts.size());
    }

    private void exportOpportunities(ZipOutputStream zos) throws IOException {
        List<Opportunity> opportunities = opportunityRepository.findAll();
        addJsonFile(zos, "opportunities.json", opportunities);
        log.info("Exported {} opportunities", opportunities.size());
    }

    private void exportProducts(ZipOutputStream zos) throws IOException {
        List<Product> products = productRepository.findAll();
        addJsonFile(zos, "products.json", products);
        log.info("Exported {} products", products.size());
    }

    private void exportProposals(ZipOutputStream zos) throws IOException {
        List<Proposal> proposals = proposalRepository.findAll();
        addJsonFile(zos, "proposals.json", proposals);
        log.info("Exported {} proposals", proposals.size());
    }

    private void exportActivities(ZipOutputStream zos) throws IOException {
        List<Activity> activities = activityRepository.findAll();
        addJsonFile(zos, "activities.json", activities);
        log.info("Exported {} activities", activities.size());
    }

    private void exportAuditLogs(ZipOutputStream zos) throws IOException {
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        addJsonFile(zos, "audit_logs.json", auditLogs);
        log.info("Exported {} audit logs", auditLogs.size());
    }

    // Helper methods

    private void addJsonFile(ZipOutputStream zos, String filename, Object data) throws IOException {
        ZipEntry entry = new ZipEntry(filename);
        zos.putNextEntry(entry);

        String json = objectMapper.writeValueAsString(data);
        zos.write(json.getBytes());

        zos.closeEntry();
    }

    private void addMetadata(ZipOutputStream zos, String tenantId) throws IOException {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tenantId", tenantId);
        metadata.put("exportedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        metadata.put("exportedBy", getCurrentUserId());
        metadata.put("format", "JSON");
        metadata.put("version", "1.0");

        // Add counts
        Organization org = organizationRepository.findById(tenantId).orElse(null);
        if (org != null) {
            metadata.put("organizationName", org.getOrganizationName());
            metadata.put("organizationId", org.getOrganizationId());
        }

        Map<String, Long> counts = new HashMap<>();
        counts.put("users", userRepository.count());
        counts.put("leads", leadRepository.count());
        counts.put("contacts", contactRepository.count());
        counts.put("accounts", accountRepository.count());
        counts.put("opportunities", opportunityRepository.count());
        counts.put("products", productRepository.count());
        counts.put("proposals", proposalRepository.count());
        counts.put("activities", activityRepository.count());
        counts.put("auditLogs", auditLogRepository.count());

        metadata.put("recordCounts", counts);

        addJsonFile(zos, "metadata.json", metadata);
    }

    /**
     * Get export summary without actually exporting
     */
    public Map<String, Object> getExportSummary() {
        String tenantId = getCurrentTenantId();

        Map<String, Object> summary = new HashMap<>();
        summary.put("tenantId", tenantId);

        Organization org = organizationRepository.findById(tenantId).orElse(null);
        if (org != null) {
            summary.put("organizationName", org.getOrganizationName());
            summary.put("organizationId", org.getOrganizationId());
        }

        Map<String, Long> counts = new HashMap<>();
        counts.put("users", userRepository.count());
        counts.put("leads", leadRepository.count());
        counts.put("contacts", contactRepository.count());
        counts.put("accounts", accountRepository.count());
        counts.put("opportunities", opportunityRepository.count());
        counts.put("products", productRepository.count());
        counts.put("proposals", proposalRepository.count());
        counts.put("activities", activityRepository.count());
        counts.put("auditLogs", auditLogRepository.count());

        long totalRecords = counts.values().stream().mapToLong(Long::longValue).sum();

        summary.put("recordCounts", counts);
        summary.put("totalRecords", totalRecords);
        summary.put("estimatedSizeMB", estimateExportSize(totalRecords));

        return summary;
    }

    private double estimateExportSize(long totalRecords) {
        // Rough estimate: ~1KB per record average
        return (totalRecords * 1024.0) / (1024.0 * 1024.0);
    }
}
