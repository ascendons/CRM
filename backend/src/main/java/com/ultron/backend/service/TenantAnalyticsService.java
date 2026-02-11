package com.ultron.backend.service;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Analytics and reporting service for tenant-specific insights
 * Provides dashboard metrics, growth trends, and performance analytics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TenantAnalyticsService extends BaseTenantService {

    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;

    /**
     * Get comprehensive dashboard statistics for the current tenant
     * MULTI-TENANT SAFE
     */
    public DashboardStats getDashboardStats() {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Getting dashboard stats", tenantId);

        return DashboardStats.builder()
                .totalLeads(leadRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .totalContacts(contactRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .totalOpportunities(opportunityRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .totalActivities(activityRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .build();
    }

    /**
     * Get growth trends over specified period
     * MULTI-TENANT SAFE
     */
    public GrowthTrends getGrowthTrends(int days) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Getting growth trends for {} days", tenantId, days);

        // TODO: Implement actual growth calculation based on date ranges
        // For now, returning current counts
        return GrowthTrends.builder()
                .period(days + " days")
                .leadGrowth(leadRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .contactGrowth(contactRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .opportunityGrowth(opportunityRepository.countByTenantIdAndIsDeletedFalse(tenantId))
                .build();
    }

    // DTOs

    @lombok.Data
    @lombok.Builder
    public static class DashboardStats {
        private long totalLeads;
        private long totalContacts;
        private long totalOpportunities;
        private long totalActivities;
    }

    @lombok.Data
    @lombok.Builder
    public static class GrowthTrends {
        private String period;
        private long leadGrowth;
        private long contactGrowth;
        private long opportunityGrowth;
    }
}
