package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Asset;
import com.ultron.backend.domain.entity.AssetCategory;
import com.ultron.backend.domain.enums.AssetStatus;
import com.ultron.backend.dto.request.CreateAssetRequest;
import com.ultron.backend.dto.request.UpdateAssetRequest;
import com.ultron.backend.dto.response.AssetResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.AssetCategoryRepository;
import com.ultron.backend.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetService extends BaseTenantService {

    private final AssetRepository assetRepository;
    private final AssetCategoryRepository categoryRepository;
    private final AssetIdGeneratorService idGeneratorService;

    public AssetResponse create(CreateAssetRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        Asset asset = Asset.builder()
                .assetCode(idGeneratorService.generateAssetId())
                .tenantId(tenantId)
                .serialNo(request.getSerialNo())
                .model(request.getModel())
                .brand(request.getBrand())
                .categoryId(request.getCategoryId())
                .accountId(request.getAccountId())
                .contactId(request.getContactId())
                .assignedEngineerId(request.getAssignedEngineerId())
                .siteAddress(request.getSiteAddress())
                .siteLat(request.getSiteLat())
                .siteLng(request.getSiteLng())
                .installDate(request.getInstallDate())
                .warrantyExpiry(request.getWarrantyExpiry())
                .status(request.getStatus() != null ? request.getStatus() : AssetStatus.ACTIVE)
                .notes(request.getNotes())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        asset = assetRepository.save(asset);
        log.info("Asset created: {} by {}", asset.getAssetCode(), userId);
        return toResponse(asset);
    }

    public List<AssetResponse> getAll() {
        return assetRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AssetResponse> getByAccount(String accountId) {
        return assetRepository.findByTenantIdAndAccountIdAndIsDeletedFalse(getCurrentTenantId(), accountId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AssetResponse> getByStatus(AssetStatus status) {
        return assetRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AssetResponse> getWarrantyExpiringSoon(int days) {
        LocalDate threshold = LocalDate.now().plusDays(days);
        return assetRepository.findByTenantIdAndWarrantyExpiryBeforeAndIsDeletedFalse(getCurrentTenantId(), threshold)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AssetResponse getById(String id) {
        return toResponse(findById(id));
    }

    public AssetResponse update(String id, UpdateAssetRequest request, String userId) {
        Asset asset = findById(id);
        if (request.getSerialNo() != null) asset.setSerialNo(request.getSerialNo());
        if (request.getModel() != null) asset.setModel(request.getModel());
        if (request.getBrand() != null) asset.setBrand(request.getBrand());
        if (request.getCategoryId() != null) asset.setCategoryId(request.getCategoryId());
        if (request.getAccountId() != null) asset.setAccountId(request.getAccountId());
        if (request.getContactId() != null) asset.setContactId(request.getContactId());
        if (request.getAssignedEngineerId() != null) asset.setAssignedEngineerId(request.getAssignedEngineerId());
        if (request.getSiteAddress() != null) asset.setSiteAddress(request.getSiteAddress());
        if (request.getSiteLat() != null) asset.setSiteLat(request.getSiteLat());
        if (request.getSiteLng() != null) asset.setSiteLng(request.getSiteLng());
        if (request.getInstallDate() != null) asset.setInstallDate(request.getInstallDate());
        if (request.getWarrantyExpiry() != null) asset.setWarrantyExpiry(request.getWarrantyExpiry());
        if (request.getStatus() != null) asset.setStatus(request.getStatus());
        if (request.getNotes() != null) asset.setNotes(request.getNotes());
        asset.setUpdatedAt(LocalDateTime.now());
        asset.setUpdatedBy(userId);
        return toResponse(assetRepository.save(asset));
    }

    public void delete(String id, String userId) {
        Asset asset = findById(id);
        asset.setDeleted(true);
        asset.setUpdatedAt(LocalDateTime.now());
        asset.setUpdatedBy(userId);
        assetRepository.save(asset);
    }

    private Asset findById(String id) {
        return assetRepository.findById(id)
                .filter(a -> a.getTenantId().equals(getCurrentTenantId()) && !a.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + id));
    }

    private AssetResponse toResponse(Asset a) {
        String categoryName = null;
        if (a.getCategoryId() != null) {
            categoryName = categoryRepository.findById(a.getCategoryId())
                    .map(AssetCategory::getName).orElse(null);
        }
        return AssetResponse.builder()
                .id(a.getId())
                .assetCode(a.getAssetCode())
                .serialNo(a.getSerialNo())
                .model(a.getModel())
                .brand(a.getBrand())
                .categoryId(a.getCategoryId())
                .categoryName(categoryName)
                .accountId(a.getAccountId())
                .contactId(a.getContactId())
                .assignedEngineerId(a.getAssignedEngineerId())
                .siteAddress(a.getSiteAddress())
                .siteLat(a.getSiteLat())
                .siteLng(a.getSiteLng())
                .installDate(a.getInstallDate())
                .warrantyExpiry(a.getWarrantyExpiry())
                .status(a.getStatus())
                .notes(a.getNotes())
                .createdAt(a.getCreatedAt())
                .createdBy(a.getCreatedBy())
                .updatedAt(a.getUpdatedAt())
                .updatedBy(a.getUpdatedBy())
                .build();
    }
}
