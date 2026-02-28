package com.ultron.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache configuration using Caffeine
 * Provides high-performance in-memory caching for:
 * - Dashboard analytics (stats, trends)
 * - Permission checks (object, field, module, path permissions)
 * - User hierarchies (subordinates, record access)
 * - Notifications
 */
@Configuration
@EnableCaching
@Slf4j
public class CacheConfig {

    public static final String DASHBOARD_STATS_CACHE = "dashboardStats";
    public static final String GROWTH_TRENDS_CACHE = "growthTrends";
    public static final String UNREAD_NOTIFICATIONS_CACHE = "unreadNotifications";

    // Permission-related caches
    public static final String PERMISSIONS_CACHE = "permissions";
    public static final String RECORD_ACCESS_CACHE = "recordAccess";
    public static final String SUBORDINATES_CACHE = "subordinates";
    public static final String ALL_SUBORDINATES_CACHE = "allSubordinates";
    public static final String SYSTEM_PERMISSIONS_CACHE = "systemPermissions";
    public static final String FIELD_PERMISSIONS_CACHE = "fieldPermissions";
    public static final String MODULE_PERMISSIONS_CACHE = "modulePermissions";
    public static final String PATH_PERMISSIONS_CACHE = "pathPermissions";

    @Bean
    public CacheManager cacheManager() {
        log.info("Initializing Caffeine cache manager");

        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                DASHBOARD_STATS_CACHE,
                GROWTH_TRENDS_CACHE,
                UNREAD_NOTIFICATIONS_CACHE,
                PERMISSIONS_CACHE,
                RECORD_ACCESS_CACHE,
                SUBORDINATES_CACHE,
                ALL_SUBORDINATES_CACHE,
                SYSTEM_PERMISSIONS_CACHE,
                FIELD_PERMISSIONS_CACHE,
                MODULE_PERMISSIONS_CACHE,
                PATH_PERMISSIONS_CACHE
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
                // Cache entries expire 5 minutes after write
                .expireAfterWrite(5, TimeUnit.MINUTES)
                // Maximum 1000 entries per cache
                .maximumSize(1000)
                // Record cache statistics for monitoring
                .recordStats()
                // Log evictions
                .evictionListener((key, value, cause) ->
                        log.debug("Cache eviction: key={}, cause={}", key, cause))
        );

        log.info("Cache manager initialized with {} caches: dashboardStats, growthTrends, unreadNotifications, permissions, recordAccess, subordinates, allSubordinates, systemPermissions, fieldPermissions, modulePermissions, pathPermissions",
                11);

        return cacheManager;
    }
}
