package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.OrganizationInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationInvitationRepository extends MongoRepository<OrganizationInvitation, String> {

    Optional<OrganizationInvitation> findByInvitationId(String invitationId);

    Optional<OrganizationInvitation> findByInvitationIdAndIsDeletedFalse(String invitationId);

    List<OrganizationInvitation> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<OrganizationInvitation> findByEmailAndIsDeletedFalse(String email);

    List<OrganizationInvitation> findByTenantIdAndStatusAndIsDeletedFalse(
            String tenantId, OrganizationInvitation.InvitationStatus status);

    Optional<OrganizationInvitation> findByEmailAndTenantIdAndStatusAndIsDeletedFalse(
            String email, String tenantId, OrganizationInvitation.InvitationStatus status);

    boolean existsByEmailAndTenantIdAndStatusAndIsDeletedFalse(
            String email, String tenantId, OrganizationInvitation.InvitationStatus status);

    long countByTenantIdAndStatusAndIsDeletedFalse(String tenantId, OrganizationInvitation.InvitationStatus status);
}
