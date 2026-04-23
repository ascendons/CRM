package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateContractRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ContractResponse;
import com.ultron.backend.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@Slf4j
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    @PreAuthorize("hasPermission('CONTRACTS', 'CREATE')")
    public ResponseEntity<ApiResponse<ContractResponse>> create(
            @Valid @RequestBody CreateContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contract created", contractService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('CONTRACTS', 'READ')")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getAll(
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) Integer expiringSoonDays) {

        List<ContractResponse> contracts;
        if (accountId != null) {
            contracts = contractService.getByAccount(accountId);
        } else if (expiringSoonDays != null) {
            contracts = contractService.getExpiringSoon(expiringSoonDays);
        } else {
            contracts = contractService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success("Contracts retrieved", contracts));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('CONTRACTS', 'READ')")
    public ResponseEntity<ApiResponse<ContractResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Contract retrieved", contractService.getById(id)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasPermission('CONTRACTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ContractResponse>> activate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Contract activated",
                contractService.activate(id, getCurrentUserId())));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasPermission('CONTRACTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ContractResponse>> cancel(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Contract cancelled",
                contractService.cancel(id, getCurrentUserId())));
    }

    @PostMapping("/{id}/renew")
    @PreAuthorize("hasPermission('CONTRACTS', 'RENEW')")
    public ResponseEntity<ApiResponse<ContractResponse>> renew(
            @PathVariable String id,
            @Valid @RequestBody CreateContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Contract renewed",
                        contractService.renew(id, request, getCurrentUserId())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('CONTRACTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ContractResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody CreateContractRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Contract updated",
                contractService.update(id, request, getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('CONTRACTS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        contractService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Contract deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
