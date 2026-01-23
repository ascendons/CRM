package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateContactRequest;
import com.ultron.backend.dto.request.UpdateContactRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ContactResponse;
import com.ultron.backend.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contacts")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<ApiResponse<ContactResponse>> createContact(
            @Valid @RequestBody CreateContactRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new contact for: {}", currentUserId, request.getEmail());

        ContactResponse contact = contactService.createContact(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<ContactResponse>builder()
                        .success(true)
                        .message("Contact created successfully")
                        .data(contact)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ContactResponse>>> getAllContacts() {
        log.info("Fetching all contacts");
        List<ContactResponse> contacts = contactService.getAllContacts();

        return ResponseEntity.ok(
                ApiResponse.<List<ContactResponse>>builder()
                        .success(true)
                        .message("Contacts retrieved successfully")
                        .data(contacts)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactResponse>> getContactById(@PathVariable String id) {
        log.info("Fetching contact with id: {}", id);
        ContactResponse contact = contactService.getContactById(id);

        return ResponseEntity.ok(
                ApiResponse.<ContactResponse>builder()
                        .success(true)
                        .message("Contact retrieved successfully")
                        .data(contact)
                        .build());
    }

    @GetMapping("/code/{contactId}")
    public ResponseEntity<ApiResponse<ContactResponse>> getContactByContactId(
            @PathVariable String contactId) {
        log.info("Fetching contact with contactId: {}", contactId);
        ContactResponse contact = contactService.getContactByContactId(contactId);

        return ResponseEntity.ok(
                ApiResponse.<ContactResponse>builder()
                        .success(true)
                        .message("Contact retrieved successfully")
                        .data(contact)
                        .build());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<ApiResponse<List<ContactResponse>>> getContactsByAccount(
            @PathVariable String accountId) {
        log.info("Fetching contacts for account: {}", accountId);
        List<ContactResponse> contacts = contactService.getContactsByAccount(accountId);

        return ResponseEntity.ok(
                ApiResponse.<List<ContactResponse>>builder()
                        .success(true)
                        .message("Contacts retrieved successfully")
                        .data(contacts)
                        .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ContactResponse>>> searchContacts(
            @RequestParam String q) {
        log.info("Searching contacts with query: {}", q);
        List<ContactResponse> contacts = contactService.searchContacts(q);

        return ResponseEntity.ok(
                ApiResponse.<List<ContactResponse>>builder()
                        .success(true)
                        .message("Search completed successfully")
                        .data(contacts)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactResponse>> updateContact(
            @PathVariable String id,
            @Valid @RequestBody UpdateContactRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating contact {}", currentUserId, id);

        ContactResponse contact = contactService.updateContact(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ContactResponse>builder()
                        .success(true)
                        .message("Contact updated successfully")
                        .data(contact)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} deleting contact {}", currentUserId, id);

        contactService.deleteContact(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Contact deleted successfully")
                        .build());
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
