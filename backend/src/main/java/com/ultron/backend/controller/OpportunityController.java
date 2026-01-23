package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.OpportunityStage;
import com.ultron.backend.dto.request.CreateOpportunityRequest;
import com.ultron.backend.dto.request.UpdateOpportunityRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.OpportunityResponse;
import com.ultron.backend.dto.response.OpportunityStatistics;
import com.ultron.backend.service.OpportunityService;
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
@RequestMapping("/opportunities")
@RequiredArgsConstructor
@Slf4j
public class OpportunityController {

    private final OpportunityService opportunityService;

    @PostMapping
    public ResponseEntity<ApiResponse<OpportunityResponse>> createOpportunity(
            @Valid @RequestBody CreateOpportunityRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new opportunity: {}", currentUserId, request.getOpportunityName());

        OpportunityResponse opportunity = opportunityService.createOpportunity(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<OpportunityResponse>builder()
                        .success(true)
                        .message("Opportunity created successfully")
                        .data(opportunity)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getAllOpportunities() {
        log.info("Fetching all opportunities");
        List<OpportunityResponse> opportunities = opportunityService.getAllOpportunities();

        return ResponseEntity.ok(
                ApiResponse.<List<OpportunityResponse>>builder()
                        .success(true)
                        .message("Opportunities retrieved successfully")
                        .data(opportunities)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OpportunityResponse>> getOpportunityById(@PathVariable String id) {
        log.info("Fetching opportunity with id: {}", id);
        OpportunityResponse opportunity = opportunityService.getOpportunityById(id);

        return ResponseEntity.ok(
                ApiResponse.<OpportunityResponse>builder()
                        .success(true)
                        .message("Opportunity retrieved successfully")
                        .data(opportunity)
                        .build());
    }

    @GetMapping("/code/{opportunityId}")
    public ResponseEntity<ApiResponse<OpportunityResponse>> getOpportunityByOpportunityId(
            @PathVariable String opportunityId) {
        log.info("Fetching opportunity with opportunityId: {}", opportunityId);
        OpportunityResponse opportunity = opportunityService.getOpportunityByOpportunityId(opportunityId);

        return ResponseEntity.ok(
                ApiResponse.<OpportunityResponse>builder()
                        .success(true)
                        .message("Opportunity retrieved successfully")
                        .data(opportunity)
                        .build());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getOpportunitiesByAccount(
            @PathVariable String accountId) {
        log.info("Fetching opportunities for account: {}", accountId);
        List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByAccount(accountId);

        return ResponseEntity.ok(
                ApiResponse.<List<OpportunityResponse>>builder()
                        .success(true)
                        .message("Opportunities retrieved successfully")
                        .data(opportunities)
                        .build());
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getOpportunitiesByContact(
            @PathVariable String contactId) {
        log.info("Fetching opportunities for contact: {}", contactId);
        List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByContact(contactId);

        return ResponseEntity.ok(
                ApiResponse.<List<OpportunityResponse>>builder()
                        .success(true)
                        .message("Opportunities retrieved successfully")
                        .data(opportunities)
                        .build());
    }

    @GetMapping("/stage/{stage}")
    public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getOpportunitiesByStage(
            @PathVariable OpportunityStage stage) {
        log.info("Fetching opportunities for stage: {}", stage);
        List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByStage(stage);

        return ResponseEntity.ok(
                ApiResponse.<List<OpportunityResponse>>builder()
                        .success(true)
                        .message("Opportunities retrieved successfully")
                        .data(opportunities)
                        .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<OpportunityResponse>>> searchOpportunities(
            @RequestParam String q) {
        log.info("Searching opportunities with query: {}", q);
        List<OpportunityResponse> opportunities = opportunityService.searchOpportunities(q);

        return ResponseEntity.ok(
                ApiResponse.<List<OpportunityResponse>>builder()
                        .success(true)
                        .message("Search completed successfully")
                        .data(opportunities)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OpportunityResponse>> updateOpportunity(
            @PathVariable String id,
            @Valid @RequestBody UpdateOpportunityRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating opportunity {}", currentUserId, id);

        OpportunityResponse opportunity = opportunityService.updateOpportunity(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<OpportunityResponse>builder()
                        .success(true)
                        .message("Opportunity updated successfully")
                        .data(opportunity)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOpportunity(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} deleting opportunity {}", currentUserId, id);

        opportunityService.deleteOpportunity(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Opportunity deleted successfully")
                        .build());
    }

    @GetMapping("/statistics/count")
    public ResponseEntity<ApiResponse<Long>> getOpportunityCount() {
        log.info("Fetching opportunity count");
        long count = opportunityService.getOpportunityCount();

        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .success(true)
                        .message("Opportunity count retrieved successfully")
                        .data(count)
                        .build());
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<OpportunityStatistics>> getStatistics() {
        log.info("Fetching opportunity statistics");
        OpportunityStatistics stats = opportunityService.getStatistics();

        return ResponseEntity.ok(
                ApiResponse.<OpportunityStatistics>builder()
                        .success(true)
                        .message("Statistics retrieved successfully")
                        .data(stats)
                        .build());
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
