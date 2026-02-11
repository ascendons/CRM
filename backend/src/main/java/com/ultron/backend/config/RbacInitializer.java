package com.ultron.backend.config;

import com.ultron.backend.service.ProfileMigrationService;
import com.ultron.backend.service.RoleMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initializer to migrate hardcoded roles and profiles to database on startup
 * Runs once on first application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RbacInitializer implements CommandLineRunner {

    private final RoleMigrationService roleMigrationService;
    private final ProfileMigrationService profileMigrationService;

    @Override
    public void run(String... args) {
        log.info("===================================================");
        log.info("RBAC INITIALIZATION: Starting Role & Profile Migration");
        log.info("===================================================");

        try {
            // Migrate roles
            roleMigrationService.migratePredefinedRolesToDatabase();

            // Migrate profiles
            profileMigrationService.migratePredefinedProfilesToDatabase();

            log.info("===================================================");
            log.info("RBAC INITIALIZATION: Completed Successfully");
            log.info("System roles and profiles are ready for use");
            log.info("===================================================");
        } catch (Exception e) {
            log.error("===================================================");
            log.error("RBAC INITIALIZATION: FAILED");
            log.error("Error: {}", e.getMessage(), e);
            log.error("===================================================");
            // Don't throw exception to allow app to start
            // The migration services will retry on next tenant registration
        }
    }
}
