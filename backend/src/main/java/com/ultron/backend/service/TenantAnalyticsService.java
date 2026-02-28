package com.ultron.backend.service;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static com.ultron.backend.config.CacheConfig.DASHBOARD_STATS_CACHE;
import static com.ultron.backend.config.CacheConfig.GROWTH_TRENDS_CACHE;

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
     * CACHED: Results cached for 5 minutes, auto-refreshed on data changes
     */
    @Cacheable(value = DASHBOARD_STATS_CACHE, key = "#root.target.getCurrentTenantId()")
    public DashboardStats getDashboardStats() {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Computing dashboard stats (cache miss)", tenantId);

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
     * CACHED: Results cached for 5 minutes, auto-refreshed on data changes
     */
    @Cacheable(value = GROWTH_TRENDS_CACHE, key = "#root.target.getCurrentTenantId() + '_' + #days")
    public GrowthTrends getGrowthTrends(int days) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Computing growth trends for {} days (cache miss)", tenantId, days);

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
