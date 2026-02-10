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
     */
    public DashboardStats getDashboardStats() {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Getting dashboard stats", tenantId);

        return DashboardStats.builder()
                .totalLeads(leadRepository.count())
                .totalContacts(contactRepository.count())
                .totalOpportunities(opportunityRepository.count())
                .totalActivities(activityRepository.count())
                .build();
    }

    /**
     * Get growth trends over specified period
     */
    public GrowthTrends getGrowthTrends(int days) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Getting growth trends for {} days", tenantId, days);

        return GrowthTrends.builder()
                .period(days + " days")
                .leadGrowth(leadRepository.count())
                .contactGrowth(contactRepository.count())
                .opportunityGrowth(opportunityRepository.count())
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
