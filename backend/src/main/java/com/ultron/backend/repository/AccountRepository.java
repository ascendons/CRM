package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Account;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends MongoRepository<Account, String> {

    Optional<Account> findByAccountId(String accountId);

    Optional<Account> findByAccountNameAndIsDeletedFalse(String accountName);

    boolean existsByAccountNameAndIsDeletedFalse(String accountName);

    List<Account> findByOwnerIdAndIsDeletedFalse(String ownerId);

    List<Account> findByIsDeletedFalse();

    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'website': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Account> searchAccounts(String searchTerm);

    long countByIsDeletedFalse();

    long countByAccountStatus(String status);
}
