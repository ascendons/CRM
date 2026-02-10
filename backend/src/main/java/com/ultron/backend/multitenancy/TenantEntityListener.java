package com.ultron.backend.multitenancy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

/**
 * MongoDB entity listener to automatically set tenantId and audit fields before persistence
 * This ensures every entity gets the correct tenant ID without manual setting
 *
 * Triggered on save() and insert() operations
 */
@Slf4j
@Component
public class TenantEntityListener extends AbstractMongoEventListener<Object> {

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Object> event) {
        Object entity = event.getSource();

        try {
            // Set tenantId if field exists and is null
            Field tenantIdField = findField(entity.getClass(), "tenantId");
            if (tenantIdField != null) {
                tenantIdField.setAccessible(true);
                Object currentValue = tenantIdField.get(entity);

                if (currentValue == null) {
                    String tenantId = TenantContext.getTenantId();
                    if (tenantId != null) {
                        tenantIdField.set(entity, tenantId);
                        log.debug("Auto-set tenantId={} for entity: {}",
                                tenantId, entity.getClass().getSimpleName());
                    } else {
                        // Skip for global entities (Organization, User during registration)
                        if (!isGlobalEntity(entity.getClass())) {
                            log.warn("Tenant context not set when persisting: {}",
                                    entity.getClass().getSimpleName());
                        }
                    }
                }
            }

            // Set audit timestamps and user info
            setAuditFields(entity);

        } catch (Exception e) {
            log.error("Error in tenant entity listener: {}", e.getMessage(), e);
        }
    }

    private void setAuditFields(Object entity) throws Exception {
        // Set createdAt if null
        Field createdAtField = findField(entity.getClass(), "createdAt");
        if (createdAtField != null) {
            createdAtField.setAccessible(true);
            if (createdAtField.get(entity) == null) {
                createdAtField.set(entity, LocalDateTime.now());
            }
        }

        // Set createdBy if null
        Field createdByField = findField(entity.getClass(), "createdBy");
        if (createdByField != null) {
            createdByField.setAccessible(true);
            if (createdByField.get(entity) == null) {
                String userId = TenantContext.getUserId();
                if (userId != null) {
                    createdByField.set(entity, userId);
                }
            }
        }

        // Always update lastModifiedAt
        Field lastModifiedAtField = findField(entity.getClass(), "lastModifiedAt");
        if (lastModifiedAtField != null) {
            lastModifiedAtField.setAccessible(true);
            lastModifiedAtField.set(entity, LocalDateTime.now());
        }

        // Always update lastModifiedBy
        Field lastModifiedByField = findField(entity.getClass(), "lastModifiedBy");
        if (lastModifiedByField != null) {
            lastModifiedByField.setAccessible(true);
            String userId = TenantContext.getUserId();
            if (userId != null) {
                lastModifiedByField.set(entity, userId);
            }
        }
    }

    /**
     * Find field in class hierarchy (including parent classes)
     */
    private Field findField(Class<?> clazz, String fieldName) {
        try {
            return clazz.getDeclaredField(fieldName);
        } catch (NoSuchFieldException e) {
            Class<?> superClass = clazz.getSuperclass();
            if (superClass != null && !superClass.equals(Object.class)) {
                return findField(superClass, fieldName);
            }
            return null;
        }
    }

    /**
     * Entities that don't require tenant filtering
     * (Organization is the tenant itself, User can belong to multiple orgs)
     */
    private boolean isGlobalEntity(Class<?> entityClass) {
        String className = entityClass.getSimpleName();
        return className.equals("Organization") || className.equals("User");
    }
}
