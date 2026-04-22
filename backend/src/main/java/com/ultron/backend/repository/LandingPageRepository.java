package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.LandingPage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LandingPageRepository extends MongoRepository<LandingPage, String> {

    List<LandingPage> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<LandingPage> findByPageIdAndTenantId(String pageId, String tenantId);

    Optional<LandingPage> findBySlugAndIsDeletedFalse(String slug);

    Optional<LandingPage> findBySlugAndPublishedTrueAndIsDeletedFalse(String slug);
}
