package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Opportunity;
import com.ultron.backend.domain.enums.OpportunityStage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OpportunityRepository extends MongoRepository<Opportunity, String> {

    Optional<Opportunity> findByOpportunityId(String opportunityId);

    boolean existsByOpportunityNameAndIsDeletedFalse(String opportunityName);

    List<Opportunity> findByIsDeletedFalse();

    List<Opportunity> findByAccountIdAndIsDeletedFalse(String accountId);

    List<Opportunity> findByPrimaryContactIdAndIsDeletedFalse(String contactId);

    List<Opportunity> findByStageAndIsDeletedFalse(OpportunityStage stage);

    List<Opportunity> findByOwnerIdAndIsDeletedFalse(String ownerId);

    long countByIsDeletedFalse();

    long countByStageAndIsDeletedFalse(OpportunityStage stage);

    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'opportunityName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } } ] }")
    List<Opportunity> searchOpportunities(String searchTerm);

    @Query("{ 'isDeleted': false, 'expectedCloseDate': { $gte: ?0, $lte: ?1 } }")
    List<Opportunity> findByExpectedCloseDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("{ 'isDeleted': false, 'stage': { $in: ['CLOSED_WON', 'CLOSED_LOST'] } }")
    List<Opportunity> findClosedOpportunities();

    @Query("{ 'isDeleted': false, 'stage': { $nin: ['CLOSED_WON', 'CLOSED_LOST'] } }")
    List<Opportunity> findOpenOpportunities();
}
