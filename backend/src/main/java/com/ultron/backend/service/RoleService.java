package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.dto.request.CreateRoleRequest;
import com.ultron.backend.dto.request.UpdateRoleRequest;
import com.ultron.backend.dto.response.RoleResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleService {

    private final RoleRepository roleRepository;
    private final RoleIdGeneratorService roleIdGeneratorService;

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request, String createdBy) {
        log.info("Creating new role: {}", request.getRoleName());

        // Validate unique name
        if (roleRepository.existsByRoleName(request.getRoleName())) {
            throw new UserAlreadyExistsException("Role name already exists: " + request.getRoleName());
        }

        // Generate role ID
        String roleId = roleIdGeneratorService.generateRoleId();

        // Calculate level based on parent
        Integer level = 0;
        String parentRoleName = null;
        if (request.getParentRoleId() != null) {
            Role parentRole = roleRepository.findByRoleId(request.getParentRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent role not found: " + request.getParentRoleId()));
            level = parentRole.getLevel() + 1;
            parentRoleName = parentRole.getRoleName();
        }

        // Build permissions with defaults
        Role.RolePermissions permissions = buildRolePermissions(request.getPermissions());

        // Build role entity
        Role role = Role.builder()
                .roleId(roleId)
                .roleName(request.getRoleName())
                .description(request.getDescription())
                .parentRoleId(request.getParentRoleId())
                .parentRoleName(parentRoleName)
                .level(level)
                .childRoleIds(new ArrayList<>())
                .permissions(permissions)
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        Role savedRole = roleRepository.save(role);

        // Update parent's child list
        if (request.getParentRoleId() != null) {
            updateParentChildList(request.getParentRoleId(), savedRole.getRoleId());
        }

        log.info("Role created successfully with roleId: {}", savedRole.getRoleId());
        return mapToResponse(savedRole);
    }

    @Transactional
    public RoleResponse updateRole(String id, UpdateRoleRequest request, String modifiedBy) {
        log.info("Updating role with id: {}", id);

        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        // Update name if changed
        if (request.getRoleName() != null && !request.getRoleName().equals(role.getRoleName())) {
            if (roleRepository.existsByRoleName(request.getRoleName())) {
                throw new UserAlreadyExistsException("Role name already exists: " + request.getRoleName());
            }
            role.setRoleName(request.getRoleName());
        }

        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        // Update parent if changed
        if (request.getParentRoleId() != null && !request.getParentRoleId().equals(role.getParentRoleId())) {
            // Remove from old parent's child list
            if (role.getParentRoleId() != null) {
                removeFromParentChildList(role.getParentRoleId(), role.getRoleId());
            }

            // Add to new parent's child list
            Role newParent = roleRepository.findByRoleId(request.getParentRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent role not found: " + request.getParentRoleId()));
            role.setParentRoleId(request.getParentRoleId());
            role.setParentRoleName(newParent.getRoleName());
            role.setLevel(newParent.getLevel() + 1);
            updateParentChildList(request.getParentRoleId(), role.getRoleId());
        }

        // Update permissions
        if (request.getPermissions() != null) {
            role.setPermissions(buildRolePermissions(request.getPermissions()));
        }

        role.setLastModifiedAt(LocalDateTime.now());
        role.setLastModifiedBy(modifiedBy);

        Role savedRole = roleRepository.save(role);
        log.info("Role updated successfully with roleId: {}", savedRole.getRoleId());
        return mapToResponse(savedRole);
    }

    public RoleResponse getRoleById(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        return mapToResponse(role);
    }

    public RoleResponse getRoleByRoleId(String roleId) {
        Role role = roleRepository.findByRoleId(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with roleId: " + roleId));
        return mapToResponse(role);
    }

    public List<RoleResponse> getAllRoles() {
        return roleRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoleResponse> getActiveRoles() {
        return roleRepository.findByIsActiveAndIsDeletedFalse(true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoleResponse> getRootRoles() {
        return roleRepository.findByParentRoleIdIsNullAndIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoleResponse> getChildRoles(String parentRoleId) {
        return roleRepository.findByParentRoleIdAndIsDeletedFalse(parentRoleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RoleResponse> searchRoles(String searchTerm) {
        return roleRepository.searchRoles(searchTerm).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRole(String id, String deletedBy) {
        log.info("Deleting role with id: {}", id);

        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        // Check if role has child roles
        if (role.getChildRoleIds() != null && !role.getChildRoleIds().isEmpty()) {
            throw new IllegalStateException("Cannot delete role with child roles. Delete child roles first.");
        }

        // Soft delete
        role.setIsDeleted(true);
        role.setDeletedAt(LocalDateTime.now());
        role.setDeletedBy(deletedBy);

        roleRepository.save(role);

        // Remove from parent's child list
        if (role.getParentRoleId() != null) {
            removeFromParentChildList(role.getParentRoleId(), role.getRoleId());
        }

        log.info("Role deleted successfully with roleId: {}", role.getRoleId());
    }

    // Helper methods
    private Role.RolePermissions buildRolePermissions(CreateRoleRequest.RolePermissionsDTO dto) {
        if (dto == null) {
            return Role.RolePermissions.builder()
                    .dataVisibility("OWN")
                    .canManageUsers(false)
                    .canManageRoles(false)
                    .canManageProfiles(false)
                    .canViewSetup(false)
                    .canManageSharing(false)
                    .canViewAllData(false)
                    .canModifyAllData(false)
                    .canViewAuditLog(false)
                    .canExportData(false)
                    .canImportData(false)
                    .build();
        }

        return Role.RolePermissions.builder()
                .dataVisibility(dto.getDataVisibility() != null ? dto.getDataVisibility() : "OWN")
                .canManageUsers(dto.getCanManageUsers() != null ? dto.getCanManageUsers() : false)
                .canManageRoles(dto.getCanManageRoles() != null ? dto.getCanManageRoles() : false)
                .canManageProfiles(dto.getCanManageProfiles() != null ? dto.getCanManageProfiles() : false)
                .canViewSetup(dto.getCanViewSetup() != null ? dto.getCanViewSetup() : false)
                .canManageSharing(dto.getCanManageSharing() != null ? dto.getCanManageSharing() : false)
                .canViewAllData(dto.getCanViewAllData() != null ? dto.getCanViewAllData() : false)
                .canModifyAllData(dto.getCanModifyAllData() != null ? dto.getCanModifyAllData() : false)
                .canViewAuditLog(dto.getCanViewAuditLog() != null ? dto.getCanViewAuditLog() : false)
                .canExportData(dto.getCanExportData() != null ? dto.getCanExportData() : false)
                .canImportData(dto.getCanImportData() != null ? dto.getCanImportData() : false)
                .customPermissions(dto.getCustomPermissions())
                .build();
    }

    private Role.RolePermissions buildRolePermissions(UpdateRoleRequest.RolePermissionsDTO dto) {
        if (dto == null) return null;

        return Role.RolePermissions.builder()
                .dataVisibility(dto.getDataVisibility())
                .canManageUsers(dto.getCanManageUsers())
                .canManageRoles(dto.getCanManageRoles())
                .canManageProfiles(dto.getCanManageProfiles())
                .canViewSetup(dto.getCanViewSetup())
                .canManageSharing(dto.getCanManageSharing())
                .canViewAllData(dto.getCanViewAllData())
                .canModifyAllData(dto.getCanModifyAllData())
                .canViewAuditLog(dto.getCanViewAuditLog())
                .canExportData(dto.getCanExportData())
                .canImportData(dto.getCanImportData())
                .customPermissions(dto.getCustomPermissions())
                .build();
    }

    private void updateParentChildList(String parentRoleId, String childRoleId) {
        roleRepository.findByRoleId(parentRoleId).ifPresent(parent -> {
            if (parent.getChildRoleIds() == null) {
                parent.setChildRoleIds(new ArrayList<>());
            }
            if (!parent.getChildRoleIds().contains(childRoleId)) {
                parent.getChildRoleIds().add(childRoleId);
                roleRepository.save(parent);
            }
        });
    }

    private void removeFromParentChildList(String parentRoleId, String childRoleId) {
        roleRepository.findByRoleId(parentRoleId).ifPresent(parent -> {
            if (parent.getChildRoleIds() != null) {
                parent.getChildRoleIds().remove(childRoleId);
                roleRepository.save(parent);
            }
        });
    }

    private RoleResponse mapToResponse(Role role) {
        RoleResponse.RolePermissionsDTO permissionsDTO = null;
        if (role.getPermissions() != null) {
            permissionsDTO = RoleResponse.RolePermissionsDTO.builder()
                    .dataVisibility(role.getPermissions().getDataVisibility())
                    .canManageUsers(role.getPermissions().getCanManageUsers())
                    .canManageRoles(role.getPermissions().getCanManageRoles())
                    .canManageProfiles(role.getPermissions().getCanManageProfiles())
                    .canViewSetup(role.getPermissions().getCanViewSetup())
                    .canManageSharing(role.getPermissions().getCanManageSharing())
                    .canViewAllData(role.getPermissions().getCanViewAllData())
                    .canModifyAllData(role.getPermissions().getCanModifyAllData())
                    .canViewAuditLog(role.getPermissions().getCanViewAuditLog())
                    .canExportData(role.getPermissions().getCanExportData())
                    .canImportData(role.getPermissions().getCanImportData())
                    .customPermissions(role.getPermissions().getCustomPermissions())
                    .build();
        }

        return RoleResponse.builder()
                .id(role.getId())
                .roleId(role.getRoleId())
                .roleName(role.getRoleName())
                .description(role.getDescription())
                .parentRoleId(role.getParentRoleId())
                .parentRoleName(role.getParentRoleName())
                .level(role.getLevel())
                .childRoleIds(role.getChildRoleIds())
                .permissions(permissionsDTO)
                .isActive(role.getIsActive())
                .isDeleted(role.getIsDeleted())
                .createdAt(role.getCreatedAt())
                .createdBy(role.getCreatedBy())
                .createdByName(role.getCreatedByName())
                .lastModifiedAt(role.getLastModifiedAt())
                .lastModifiedBy(role.getLastModifiedBy())
                .lastModifiedByName(role.getLastModifiedByName())
                .build();
    }
}
