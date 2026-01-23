package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateAccountRequest;
import com.ultron.backend.dto.request.UpdateAccountRequest;
import com.ultron.backend.dto.response.AccountResponse;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.AccountService;
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
@RequestMapping("/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new account: {}", currentUserId, request.getAccountName());

        AccountResponse account = accountService.createAccount(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<AccountResponse>builder()
                        .success(true)
                        .message("Account created successfully")
                        .data(account)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAllAccounts() {
        log.info("Fetching all accounts");
        List<AccountResponse> accounts = accountService.getAllAccounts();

        return ResponseEntity.ok(
                ApiResponse.<List<AccountResponse>>builder()
                        .success(true)
                        .message("Accounts retrieved successfully")
                        .data(accounts)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountById(@PathVariable String id) {
        log.info("Fetching account with id: {}", id);
        AccountResponse account = accountService.getAccountById(id);

        return ResponseEntity.ok(
                ApiResponse.<AccountResponse>builder()
                        .success(true)
                        .message("Account retrieved successfully")
                        .data(account)
                        .build());
    }

    @GetMapping("/code/{accountId}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountByAccountId(
            @PathVariable String accountId) {
        log.info("Fetching account with accountId: {}", accountId);
        AccountResponse account = accountService.getAccountByAccountId(accountId);

        return ResponseEntity.ok(
                ApiResponse.<AccountResponse>builder()
                        .success(true)
                        .message("Account retrieved successfully")
                        .data(account)
                        .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> searchAccounts(
            @RequestParam String q) {
        log.info("Searching accounts with query: {}", q);
        List<AccountResponse> accounts = accountService.searchAccounts(q);

        return ResponseEntity.ok(
                ApiResponse.<List<AccountResponse>>builder()
                        .success(true)
                        .message("Search completed successfully")
                        .data(accounts)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @PathVariable String id,
            @Valid @RequestBody UpdateAccountRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating account {}", currentUserId, id);

        AccountResponse account = accountService.updateAccount(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<AccountResponse>builder()
                        .success(true)
                        .message("Account updated successfully")
                        .data(account)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} deleting account {}", currentUserId, id);

        accountService.deleteAccount(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Account deleted successfully")
                        .build());
    }

    @GetMapping("/statistics/count")
    public ResponseEntity<ApiResponse<Long>> getAccountCount() {
        log.info("Fetching account count");
        long count = accountService.getAccountCount();

        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .success(true)
                        .message("Account count retrieved successfully")
                        .data(count)
                        .build());
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
