package com.ultron.backend.aspect;

import com.ultron.backend.domain.entity.UserActivity.ActionType;
import com.ultron.backend.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.util.Arrays;

/**
 * AOP Aspect for automatically tracking user activities on API operations
 * Intercepts controller methods and logs activities to the database
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityTrackingAspect {

    private final UserActivityService userActivityService;

    /**
     * Pointcut for all controller methods except UserActivityController
     * to avoid recursive logging
     */
    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) " +
              "&& !within(com.ultron.backend.controller.UserActivityController) " +
              "&& !within(com.ultron.backend.controller.AuthController)")
    public void controllerMethods() {}

    /**
     * Advice that runs after successful controller method execution
     */
    @AfterReturning(
        pointcut = "controllerMethods()",
        returning = "result"
    )
    public void logActivityAfterControllerMethod(JoinPoint joinPoint, Object result) {
        try {
            // Get the authentication from SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
                return; // Skip logging for unauthenticated requests
            }

            String userId = authentication.getName();

            // Get method information
            Method method = getMethod(joinPoint);
            if (method == null) {
                return;
            }

            // Determine action type based on HTTP method
            ActionType actionType = determineActionType(method);
            if (actionType == null) {
                return; // Skip logging if we can't determine action type
            }

            // Extract entity information from the method and arguments
            EntityInfo entityInfo = extractEntityInfo(joinPoint, method, result);

            // Log the activity asynchronously
            if (entityInfo != null && entityInfo.entityType != null) {
                String action = actionType.name();
                String description = buildDescription(actionType, entityInfo);

                userActivityService.logActivityAsync(
                    userId,
                    actionType,
                    action,
                    entityInfo.entityType,
                    entityInfo.entityId,
                    entityInfo.entityName,
                    description,
                    null, // oldValue - would need to be tracked separately for updates
                    null, // newValue - would need to be tracked separately for updates
                    null  // metadata
                );

                log.debug("Activity logged: user={}, action={}, entity={}/{}",
                         userId, action, entityInfo.entityType, entityInfo.entityId);
            }

        } catch (Exception e) {
            // Don't let activity logging failures affect the main business logic
            log.error("Failed to log activity: {}", e.getMessage(), e);
        }
    }

    private Method getMethod(JoinPoint joinPoint) {
        try {
            String methodName = joinPoint.getSignature().getName();
            Class<?> targetClass = joinPoint.getTarget().getClass();

            return Arrays.stream(targetClass.getMethods())
                    .filter(m -> m.getName().equals(methodName))
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            log.debug("Failed to get method: {}", e.getMessage());
            return null;
        }
    }

    private ActionType determineActionType(Method method) {
        if (method.isAnnotationPresent(PostMapping.class)) {
            return ActionType.CREATE;
        } else if (method.isAnnotationPresent(GetMapping.class)) {
            // Don't log simple GET requests to reduce noise
            // Only log if it's a search or specific operation
            String methodName = method.getName().toLowerCase();
            if (methodName.contains("search")) {
                return ActionType.SEARCH;
            }
            // Skip logging for regular GET operations
            return null;
        } else if (method.isAnnotationPresent(PutMapping.class) ||
                   method.isAnnotationPresent(PatchMapping.class)) {
            return ActionType.UPDATE;
        } else if (method.isAnnotationPresent(DeleteMapping.class)) {
            return ActionType.DELETE;
        }
        return null;
    }

    private EntityInfo extractEntityInfo(JoinPoint joinPoint, Method method, Object result) {
        EntityInfo info = new EntityInfo();

        // Extract entity type from controller class name
        String className = joinPoint.getTarget().getClass().getSimpleName();
        if (className.endsWith("Controller")) {
            String entityType = className.replace("Controller", "").toUpperCase();
            info.entityType = entityType;
        }

        // Try to extract entity ID from method arguments (path variables)
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof String && ((String) arg).length() == 24) {
                // Likely a MongoDB ObjectId
                info.entityId = (String) arg;
                break;
            }
        }

        // Try to extract entity name from the response
        if (result instanceof ResponseEntity) {
            ResponseEntity<?> response = (ResponseEntity<?>) result;
            Object body = response.getBody();

            if (body != null) {
                try {
                    // Try to extract name/title from the response using reflection
                    Class<?> bodyClass = body.getClass();

                    // Common field names for entity names
                    String[] nameFields = {"name", "title", "fullName", "productName",
                                          "firstName", "lastName", "subject"};

                    for (String fieldName : nameFields) {
                        try {
                            Method getter = bodyClass.getMethod("get" +
                                capitalize(fieldName));
                            Object value = getter.invoke(body);
                            if (value instanceof String && !((String) value).isEmpty()) {
                                info.entityName = (String) value;
                                break;
                            }
                        } catch (Exception ignored) {
                            // Field doesn't exist, try next one
                        }
                    }
                } catch (Exception e) {
                    log.debug("Failed to extract entity name: {}", e.getMessage());
                }
            }
        }

        return info;
    }

    private String buildDescription(ActionType actionType, EntityInfo entityInfo) {
        String action = actionType.name().toLowerCase();
        String entity = entityInfo.entityType != null ?
                       entityInfo.entityType.toLowerCase() : "entity";
        String name = entityInfo.entityName != null ? entityInfo.entityName : "";

        if (name.isEmpty() && entityInfo.entityId != null) {
            name = entityInfo.entityId;
        }

        switch (actionType) {
            case CREATE:
                return String.format("Created %s: %s", entity, name);
            case UPDATE:
                return String.format("Updated %s: %s", entity, name);
            case DELETE:
                return String.format("Deleted %s: %s", entity, name);
            case SEARCH:
                return String.format("Searched %s", entity);
            default:
                return String.format("%s %s", action, entity);
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private static class EntityInfo {
        String entityType;
        String entityId;
        String entityName;
    }
}
