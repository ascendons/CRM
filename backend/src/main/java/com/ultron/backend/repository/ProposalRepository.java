package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends MongoRepository<Proposal, String> {

    Optional<Proposal> findByProposalId(String proposalId);

    List<Proposal> findByIsDeletedFalse();

    List<Proposal> findBySourceAndSourceIdAndIsDeletedFalse(ProposalSource source, String sourceId);

    List<Proposal> findByStatusAndIsDeletedFalse(ProposalStatus status);

    List<Proposal> findByOwnerIdAndIsDeletedFalse(String ownerId);

    @Query("{ 'isDeleted': false, 'validUntil': { $lt: ?0 }, 'status': 'SENT' }")
    List<Proposal> findExpiredProposals(LocalDate currentDate);

    @Query("{ 'isDeleted': false, 'status': ?0, 'source': ?1, 'sourceId': ?2 }")
    List<Proposal> findByStatusAndSource(ProposalStatus status, ProposalSource source, String sourceId);

    @Query("{ 'isDeleted': false, '$or': [ " +
           "{ 'title': { $regex: ?0, $options: 'i' } }, " +
           "{ 'customerName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'proposalNumber': { $regex: ?0, $options: 'i' } } ] }")
    List<Proposal> searchProposals(String searchTerm);
}
