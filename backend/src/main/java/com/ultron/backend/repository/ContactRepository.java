package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Contact;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends MongoRepository<Contact, String> {

    Optional<Contact> findByContactId(String contactId);

    Optional<Contact> findByEmailAndIsDeletedFalse(String email);

    boolean existsByEmailAndIsDeletedFalse(String email);

    List<Contact> findByAccountIdAndIsDeletedFalse(String accountId);

    List<Contact> findByOwnerIdAndIsDeletedFalse(String ownerId);

    List<Contact> findByIsDeletedFalse();

    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'contactId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Contact> searchContacts(String searchTerm);

    long countByIsDeletedFalse();
}
