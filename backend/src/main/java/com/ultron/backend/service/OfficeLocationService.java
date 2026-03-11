package com.ultron.backend.service;

import com.ultron.backend.domain.entity.OfficeLocation;
import com.ultron.backend.dto.request.CreateOfficeLocationRequest;
import com.ultron.backend.dto.request.UpdateOfficeLocationRequest;
import com.ultron.backend.dto.response.OfficeLocationResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.OfficeLocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for office location management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OfficeLocationService extends BaseTenantService {

    private final OfficeLocationRepository officeLocationRepository;
    private final OfficeLocationIdGeneratorService idGenerator;

    /**
     * Create new office location
     */
    @CacheEvict(value = "officeLocations", allEntries = true)
    public OfficeLocationResponse createLocation(CreateOfficeLocationRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        log.info("Creating office location: {} for tenant: {}", request.getName(), tenantId);

        // Check for duplicate code
        if (officeLocationRepository.findByCodeAndTenantIdAndIsDeletedFalse(request.getCode(), tenantId).isPresent()) {
            throw new BusinessException("Office location with code '" + request.getCode() + "' already exists");
        }

        // If setting as headquarters, remove headquarters flag from existing locations
        if (Boolean.TRUE.equals(request.getIsHeadquarters())) {
            officeLocationRepository.findByTenantIdAndIsHeadquartersTrueAndIsDeletedFalse(tenantId)
                .ifPresent(existingHQ -> {
                    existingHQ.setIsHeadquarters(false);
                    officeLocationRepository.save(existingHQ);
                });
        }

        OfficeLocation location = OfficeLocation.builder()
            .locationId(idGenerator.generateLocationId())
            .tenantId(tenantId)
            .name(request.getName())
            .code(request.getCode())
            .address(request.getAddress())
            .city(request.getCity())
            .state(request.getState())
            .country(request.getCountry())
            .postalCode(request.getPostalCode())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .radiusMeters(request.getRadiusMeters() != null ? request.getRadiusMeters() : 100)
            .shape(request.getShape())
            .enforceGeofence(request.getEnforceGeofence() != null ? request.getEnforceGeofence() : true)
            .allowManualOverride(request.getAllowManualOverride() != null ? request.getAllowManualOverride() : false)
            .type(request.getType())
            .isHeadquarters(request.getIsHeadquarters() != null ? request.getIsHeadquarters() : false)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .allowRemoteCheckIn(request.getAllowRemoteCheckIn() != null ? request.getAllowRemoteCheckIn() : false)
            .contactPerson(request.getContactPerson())
            .contactPhone(request.getContactPhone())
            .contactEmail(request.getContactEmail())
            .createdAt(LocalDateTime.now())
            .createdBy(userId)
            .isDeleted(false)
            .build();

        location = officeLocationRepository.save(location);

        log.info("✅ Office location created: {} ({})", location.getName(), location.getLocationId());

        return mapToResponse(location);
    }

    /**
     * Update office location
     */
    @CacheEvict(value = "officeLocations", allEntries = true)
    public OfficeLocationResponse updateLocation(String id, UpdateOfficeLocationRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        OfficeLocation location = officeLocationRepository.findByLocationIdAndTenantIdAndIsDeletedFalse(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Office location not found"));

        validateResourceTenantOwnership(location.getTenantId());

        // Check for duplicate code if changing
        if (request.getCode() != null && !request.getCode().equals(location.getCode())) {
            if (officeLocationRepository.findByCodeAndTenantIdAndIsDeletedFalse(request.getCode(), tenantId).isPresent()) {
                throw new BusinessException("Office location with code '" + request.getCode() + "' already exists");
            }
            location.setCode(request.getCode());
        }

        // If setting as headquarters, remove headquarters flag from existing locations
        if (Boolean.TRUE.equals(request.getIsHeadquarters()) && !Boolean.TRUE.equals(location.getIsHeadquarters())) {
            officeLocationRepository.findByTenantIdAndIsHeadquartersTrueAndIsDeletedFalse(tenantId)
                .ifPresent(existingHQ -> {
                    existingHQ.setIsHeadquarters(false);
                    officeLocationRepository.save(existingHQ);
                });
        }

        // Update fields
        if (request.getName() != null) location.setName(request.getName());
        if (request.getAddress() != null) location.setAddress(request.getAddress());
        if (request.getCity() != null) location.setCity(request.getCity());
        if (request.getState() != null) location.setState(request.getState());
        if (request.getCountry() != null) location.setCountry(request.getCountry());
        if (request.getPostalCode() != null) location.setPostalCode(request.getPostalCode());
        if (request.getLatitude() != null) location.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) location.setLongitude(request.getLongitude());
        if (request.getRadiusMeters() != null) location.setRadiusMeters(request.getRadiusMeters());
        if (request.getShape() != null) location.setShape(request.getShape());
        if (request.getEnforceGeofence() != null) location.setEnforceGeofence(request.getEnforceGeofence());
        if (request.getAllowManualOverride() != null) location.setAllowManualOverride(request.getAllowManualOverride());
        if (request.getType() != null) location.setType(request.getType());
        if (request.getIsHeadquarters() != null) location.setIsHeadquarters(request.getIsHeadquarters());
        if (request.getIsActive() != null) location.setIsActive(request.getIsActive());
        if (request.getAllowRemoteCheckIn() != null) location.setAllowRemoteCheckIn(request.getAllowRemoteCheckIn());
        if (request.getContactPerson() != null) location.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null) location.setContactPhone(request.getContactPhone());
        if (request.getContactEmail() != null) location.setContactEmail(request.getContactEmail());

        location.setLastModifiedAt(LocalDateTime.now());
        location.setLastModifiedBy(userId);

        location = officeLocationRepository.save(location);

        log.info("✅ Office location updated: {} ({})", location.getName(), location.getLocationId());

        return mapToResponse(location);
    }

    /**
     * Delete office location (soft delete)
     */
    @CacheEvict(value = "officeLocations", allEntries = true)
    public void deleteLocation(String id) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        OfficeLocation location = officeLocationRepository.findByLocationIdAndTenantIdAndIsDeletedFalse(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Office location not found"));

        validateResourceTenantOwnership(location.getTenantId());

        if (Boolean.TRUE.equals(location.getIsHeadquarters())) {
            throw new BusinessException("Cannot delete headquarters. Please set another location as headquarters first.");
        }

        location.setIsDeleted(true);
        location.setLastModifiedAt(LocalDateTime.now());
        location.setLastModifiedBy(userId);

        officeLocationRepository.save(location);

        log.info("✅ Office location deleted: {} ({})", location.getName(), location.getLocationId());
    }

    /**
     * Get location by ID (using locationId, not MongoDB _id)
     */
    @Cacheable(value = "officeLocations", key = "#id")
    public OfficeLocationResponse getLocationResponseById(String id) {
        String tenantId = getCurrentTenantId();
        OfficeLocation location = officeLocationRepository.findByLocationIdAndTenantIdAndIsDeletedFalse(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Office location not found"));

        validateResourceTenantOwnership(location.getTenantId());

        return mapToResponse(location);
    }

    /**
     * Get location entity by locationId (for internal use)
     */
    public OfficeLocation getLocationById(String locationId) {
        String tenantId = getCurrentTenantId();
        return officeLocationRepository.findByLocationIdAndTenantIdAndIsDeletedFalse(locationId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Office location not found: " + locationId));
    }

    /**
     * Get all locations for tenant
     */
    @Cacheable(value = "officeLocations", key = "#tenantId + '_all'")
    public List<OfficeLocationResponse> getAllLocations() {
        String tenantId = getCurrentTenantId();

        List<OfficeLocation> locations = officeLocationRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        return locations.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get active locations only
     */
    public List<OfficeLocationResponse> getActiveLocations() {
        String tenantId = getCurrentTenantId();

        List<OfficeLocation> locations = officeLocationRepository.findByTenantIdAndIsActiveTrueAndIsDeletedFalse(tenantId);

        return locations.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Map entity to response DTO
     */
    private OfficeLocationResponse mapToResponse(OfficeLocation location) {
        return OfficeLocationResponse.builder()
            .id(location.getId())
            .locationId(location.getLocationId())
            .name(location.getName())
            .code(location.getCode())
            .address(location.getAddress())
            .city(location.getCity())
            .state(location.getState())
            .country(location.getCountry())
            .postalCode(location.getPostalCode())
            .latitude(location.getLatitude())
            .longitude(location.getLongitude())
            .radiusMeters(location.getRadiusMeters())
            .shape(location.getShape())
            .enforceGeofence(location.getEnforceGeofence())
            .allowManualOverride(location.getAllowManualOverride())
            .type(location.getType())
            .isHeadquarters(location.getIsHeadquarters())
            .isActive(location.getIsActive())
            .allowRemoteCheckIn(location.getAllowRemoteCheckIn())
            .contactPerson(location.getContactPerson())
            .contactPhone(location.getContactPhone())
            .contactEmail(location.getContactEmail())
            .createdAt(location.getCreatedAt())
            .createdBy(location.getCreatedBy())
            .lastModifiedAt(location.getLastModifiedAt())
            .lastModifiedBy(location.getLastModifiedBy())
            .build();
    }
}
