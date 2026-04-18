package com.ultron.backend.service;

import com.ultron.backend.domain.entity.AssetCategory;
import com.ultron.backend.dto.request.CreateAssetCategoryRequest;
import com.ultron.backend.dto.response.AssetCategoryResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.AssetCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetCategoryService extends BaseTenantService {

    private final AssetCategoryRepository categoryRepository;

    public AssetCategoryResponse create(CreateAssetCategoryRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        AssetCategory category = AssetCategory.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .type(request.getType())
                .description(request.getDescription())
                .defaultChecklistTemplateId(request.getDefaultChecklistTemplateId())
                .requiredSkills(request.getRequiredSkills())
                .maintenanceIntervalDays(request.getMaintenanceIntervalDays())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        category = categoryRepository.save(category);
        log.info("Asset category created: {} by {}", category.getId(), userId);
        return toResponse(category);
    }

    public List<AssetCategoryResponse> getAll() {
        return categoryRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AssetCategoryResponse getById(String id) {
        return toResponse(findById(id));
    }

    public AssetCategoryResponse update(String id, CreateAssetCategoryRequest request, String userId) {
        AssetCategory category = findById(id);
        category.setName(request.getName());
        category.setType(request.getType());
        category.setDescription(request.getDescription());
        category.setDefaultChecklistTemplateId(request.getDefaultChecklistTemplateId());
        category.setRequiredSkills(request.getRequiredSkills());
        category.setMaintenanceIntervalDays(request.getMaintenanceIntervalDays());
        category.setUpdatedAt(LocalDateTime.now());
        category.setUpdatedBy(userId);
        return toResponse(categoryRepository.save(category));
    }

    public void delete(String id, String userId) {
        AssetCategory category = findById(id);
        category.setDeleted(true);
        category.setUpdatedAt(LocalDateTime.now());
        category.setUpdatedBy(userId);
        categoryRepository.save(category);
    }

    private AssetCategory findById(String id) {
        return categoryRepository.findById(id)
                .filter(c -> c.getTenantId().equals(getCurrentTenantId()) && !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Asset category not found: " + id));
    }

    private AssetCategoryResponse toResponse(AssetCategory c) {
        return AssetCategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .type(c.getType())
                .description(c.getDescription())
                .defaultChecklistTemplateId(c.getDefaultChecklistTemplateId())
                .requiredSkills(c.getRequiredSkills())
                .maintenanceIntervalDays(c.getMaintenanceIntervalDays())
                .createdAt(c.getCreatedAt())
                .createdBy(c.getCreatedBy())
                .build();
    }
}
