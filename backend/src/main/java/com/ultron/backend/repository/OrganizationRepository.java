package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Organization;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Organization (Tenant) entity
 * Note: Organization queries don't need tenant filtering since this IS the tenant root
 */
@Repository
public interface OrganizationRepository extends MongoRepository<Organization, String> {

    @Query("{ 'organizationId': ?0, 'isDeleted': false }")
    Optional<Organization> findByOrganizationId(String organizationId);

    @Query("{ 'subdomain': ?0, 'isDeleted': false }")
    Optional<Organization> findBySubdomain(String subdomain);

    @Query("{ 'primaryEmail': ?0, 'isDeleted': false }")
    Optional<Organization> findByPrimaryEmail(String primaryEmail);

    @Query(value = "{ 'subdomain': ?0, 'isDeleted': false }", exists = true)
    boolean existsBySubdomain(String subdomain);

    @Query(value = "{ 'organizationId': ?0, 'isDeleted': false }", exists = true)
    boolean existsByOrganizationId(String organizationId);

    @Query("{ 'status': ?0, 'isDeleted': false }")
    java.util.List<Organization> findByStatus(Organization.OrganizationStatus status);
}
