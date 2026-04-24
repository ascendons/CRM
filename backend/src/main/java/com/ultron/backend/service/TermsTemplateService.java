package com.ultron.backend.service;

import com.ultron.backend.domain.entity.TermsTemplate;
import com.ultron.backend.domain.enums.TermsType;
import com.ultron.backend.dto.request.CreateTermsTemplateRequest;
import com.ultron.backend.dto.response.TermsTemplateResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.TermsTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TermsTemplateService extends BaseTenantService {

    private final TermsTemplateRepository termsTemplateRepository;

    /**
     * Get all non-deleted terms templates for the current tenant.
     */
    public List<TermsTemplateResponse> getAll() {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching all terms templates", tenantId);
        return termsTemplateRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get terms templates filtered by type for the current tenant.
     */
    public List<TermsTemplateResponse> getByType(TermsType type) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Fetching terms templates of type: {}", tenantId, type);
        return termsTemplateRepository.findByTenantIdAndTypeAndIsDeletedFalse(tenantId, type)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new terms template. Admin only.
     * If isDefault=true, clears existing defaults for the same type first.
     */
    public TermsTemplateResponse create(CreateTermsTemplateRequest request) {
        requireAdmin();
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        log.info("[Tenant: {}] Creating terms template: {} (type={})", tenantId, request.getName(), request.getType());

        if (request.isDefault()) {
            clearDefaultsForType(tenantId, request.getType());
        }

        TermsTemplate template = TermsTemplate.builder()
                .tenantId(tenantId)
                .type(request.getType())
                .name(request.getName())
                .content(request.getContent())
                .isDefault(request.isDefault())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(userId)
                .build();

        TermsTemplate saved = termsTemplateRepository.save(template);
        log.info("[Tenant: {}] Terms template created with id: {}", tenantId, saved.getId());
        return toResponse(saved);
    }

    /**
     * Update an existing terms template. Admin only.
     * If isDefault=true, clears existing defaults for the same type first.
     */
    public TermsTemplateResponse update(String id, CreateTermsTemplateRequest request) {
        requireAdmin();
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        TermsTemplate existing = termsTemplateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Terms template not found: " + id));

        log.info("[Tenant: {}] Updating terms template: {}", tenantId, id);

        if (request.isDefault()) {
            clearDefaultsForType(tenantId, request.getType());
        }

        existing.setType(request.getType());
        existing.setName(request.getName());
        existing.setContent(request.getContent());
        existing.setDefault(request.isDefault());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);

        TermsTemplate saved = termsTemplateRepository.save(existing);
        return toResponse(saved);
    }

    /**
     * Soft-delete a terms template. Admin only.
     */
    public void delete(String id) {
        requireAdmin();
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        TermsTemplate existing = termsTemplateRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Terms template not found: " + id));

        log.info("[Tenant: {}] Soft-deleting terms template: {}", tenantId, id);

        existing.setDeleted(true);
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);
        termsTemplateRepository.save(existing);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void requireAdmin() {
        if (!isCurrentUserTenantAdmin()) {
            throw new AccessDeniedException("Only tenant admins can manage terms templates");
        }
    }

    /**
     * Set isDefault=false on all existing default templates for the given type,
     * so only one template per type can be the default at a time.
     */
    private void clearDefaultsForType(String tenantId, TermsType type) {
        List<TermsTemplate> currentDefaults =
                termsTemplateRepository.findByTenantIdAndTypeAndIsDefaultTrueAndIsDeletedFalse(tenantId, type);
        currentDefaults.forEach(t -> t.setDefault(false));
        if (!currentDefaults.isEmpty()) {
            termsTemplateRepository.saveAll(currentDefaults);
        }
    }

    private TermsTemplateResponse toResponse(TermsTemplate template) {
        return TermsTemplateResponse.builder()
                .id(template.getId())
                .tenantId(template.getTenantId())
                .type(template.getType())
                .name(template.getName())
                .content(template.getContent())
                .isDefault(template.isDefault())
                .isDeleted(template.isDeleted())
                .createdAt(template.getCreatedAt())
                .createdBy(template.getCreatedBy())
                .updatedAt(template.getUpdatedAt())
                .updatedBy(template.getUpdatedBy())
                .build();
    }
}
