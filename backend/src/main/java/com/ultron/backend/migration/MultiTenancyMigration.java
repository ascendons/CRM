package com.ultron.backend.migration;

import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * One-time migration script to add multi-tenancy to existing data
 *
 * This script:
 * 1. Creates a default organization for existing data
 * 2. Sets tenantId on all existing entities
 *
 * Run once during deployment to multi-tenant architecture
 *
 * To disable after migration, set: migration.multitenancy.enabled=false in
 * application.properties
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MultiTenancyMigration implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;
    private final OrganizationRepository organizationRepository;

    // Set to false after migration is complete
    private static final boolean MIGRATION_ENABLED = false;

    @Override
    public void run(String... args) throws Exception {
        if (!MIGRATION_ENABLED) {
            log.info("Multi-tenancy migration is disabled. Skipping...");
            return;
        }

        log.info("========================================");
        log.info("Starting Multi-Tenancy Migration");
        log.info("========================================");

        try {
            // Check if default organization already exists
            if (organizationRepository.existsByOrganizationId("ORG-DEFAULT-00001")) {
                log.info("Default organization already exists. Migration may have already run.");
                log.info("Checking for unmigrated data...");
            }

            // Create or get default organization
            Organization defaultOrg = createOrGetDefaultOrganization();
            String defaultTenantId = defaultOrg.getId();

            log.info("Default organization ID: {}", defaultTenantId);
            log.info("Migrating existing data to tenant: {}", defaultTenantId);

            // Migrate all collections
            int totalMigrated = 0;
            totalMigrated += migrateCollection("users", defaultTenantId);
            totalMigrated += migrateCollection("leads", defaultTenantId);
            totalMigrated += migrateCollection("contacts", defaultTenantId);
            totalMigrated += migrateCollection("accounts", defaultTenantId);
            totalMigrated += migrateCollection("opportunities", defaultTenantId);
            totalMigrated += migrateCollection("products", defaultTenantId);
            totalMigrated += migrateCollection("proposals", defaultTenantId);
            totalMigrated += migrateCollection("activities", defaultTenantId);
            totalMigrated += migrateCollection("audit_logs", defaultTenantId);
            totalMigrated += migrateCollection("user_activities", defaultTenantId);

            log.info("========================================");
            log.info("Multi-Tenancy Migration Completed");
            log.info("Total documents migrated: {}", totalMigrated);
            log.info("========================================");
            log.info("IMPORTANT: Set MIGRATION_ENABLED = false in MultiTenancyMigration.java to prevent re-running");
            log.info("========================================");

        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage(), e);
            log.error("========================================");
            log.error("MIGRATION FAILED - Please check logs");
            log.error("========================================");
        }
    }

    private Organization createOrGetDefaultOrganization() {
        // Check if default organization exists
        return organizationRepository.findByOrganizationId("ORG-DEFAULT-00001")
                .orElseGet(() -> {
                    log.info("Creating default organization for existing data...");

                    Organization org = Organization.builder()
                            .organizationId("ORG-DEFAULT-00001")
                            .organizationName("Default Organization")
                            .displayName("Default Organization")
                            .subdomain("default")
                            .primaryEmail("admin@ascendons.com")
                            .status(Organization.OrganizationStatus.ACTIVE)
                            .subscription(Organization.SubscriptionInfo.builder()
                                    .planType("ENTERPRISE")
                                    .startDate(LocalDateTime.now())
                                    .billingCycle("ANNUAL")
                                    .paymentStatus("ACTIVE")
                                    .build())
                            .limits(Organization.UsageLimits.builder()
                                    .maxUsers(999999)
                                    .maxLeads(999999)
                                    .maxContacts(999999)
                                    .maxAccounts(999999)
                                    .maxOpportunities(999999)
                                    .maxProducts(999999)
                                    .maxStorageMB(9999999L)
                                    .maxApiCallsPerDay(999999)
                                    .customFieldsEnabled(true)
                                    .apiAccessEnabled(true)
                                    .advancedReportsEnabled(true)
                                    .build())
                            .usage(Organization.UsageMetrics.builder()
                                    .currentUsers(0)
                                    .currentLeads(0)
                                    .currentContacts(0)
                                    .currentAccounts(0)
                                    .currentOpportunities(0)
                                    .currentProducts(0)
                                    .lastCalculated(LocalDateTime.now())
                                    .build())
                            .settings(Organization.OrganizationSettings.builder()
                                    .dateFormat("DD/MM/YYYY")
                                    .timeFormat("HH:mm")
                                    .language("en")
                                    .emailNotificationsEnabled(true)
                                    .build())
                            .security(Organization.SecuritySettings.builder()
                                    .twoFactorRequired(false)
                                    .sessionTimeoutMinutes(480)
                                    .auditLogEnabled(true)
                                    .encryptionEnabled(true)
                                    .build())
                            .createdAt(LocalDateTime.now())
                            .isDeleted(false)
                            .build();

                    Organization saved = organizationRepository.save(org);
                    log.info("Default organization created: {} (ID: {})", saved.getOrganizationName(), saved.getId());
                    return saved;
                });
    }

    private int migrateCollection(String collectionName, String defaultTenantId) {
        try {
            // Find documents without tenantId
            Query query = new Query(Criteria.where("tenantId").exists(false));
            Update update = new Update().set("tenantId", defaultTenantId);

            long count = mongoTemplate.updateMulti(query, update, collectionName).getModifiedCount();

            if (count > 0) {
                log.info("Migrated {} documents in collection: {}", count, collectionName);
            } else {
                log.debug("No documents to migrate in collection: {}", collectionName);
            }

            return (int) count;

        } catch (Exception e) {
            log.error("Error migrating collection {}: {}", collectionName, e.getMessage());
            return 0;
        }
    }

    /**
     * Rollback migration (in case of issues)
     * WARNING: This will remove tenantId from all documents
     */
    public void rollbackMigration(String tenantId) {
        log.warn("========================================");
        log.warn("Rolling back migration for tenant: {}", tenantId);
        log.warn("========================================");

        String[] collections = { "users", "leads", "contacts", "accounts",
                "opportunities", "products", "proposals", "activities",
                "audit_logs", "user_activities" };

        for (String collection : collections) {
            Query query = new Query(Criteria.where("tenantId").is(tenantId));
            Update update = new Update().unset("tenantId");
            long count = mongoTemplate.updateMulti(query, update, collection).getModifiedCount();
            log.warn("Removed tenantId from {} documents in {}", count, collection);
        }

        // Delete the organization
        organizationRepository.deleteById(tenantId);
        log.warn("Deleted organization: {}", tenantId);

        log.warn("========================================");
        log.warn("Rollback completed");
        log.warn("========================================");
    }
}
