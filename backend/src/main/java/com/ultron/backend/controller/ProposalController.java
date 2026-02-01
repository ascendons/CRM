package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import com.ultron.backend.dto.request.CreateProposalRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProposalResponse;
import com.ultron.backend.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/proposals")
@RequiredArgsConstructor
@Slf4j
public class ProposalController {

    private final ProposalService proposalService;

    /**
     * Create a new proposal
     * POST /api/v1/proposals
     */
    @PostMapping
    @PreAuthorize("hasPermission('PROPOSAL', 'CREATE')")
    public ResponseEntity<ApiResponse<ProposalResponse>> createProposal(
            @Valid @RequestBody CreateProposalRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} creating new proposal for: {}", currentUserId, request.getSourceId());

        ProposalResponse proposal = proposalService.createProposal(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<ProposalResponse>builder()
                        .success(true)
                        .message("Proposal created successfully")
                        .data(proposal)
                        .build());
    }

    /**
     * Get all proposals
     * GET /api/v1/proposals
     */
    @GetMapping
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getAllProposals() {
        log.info("Fetching all proposals");

        List<ProposalResponse> proposals = proposalService.getAllProposals();

        return ResponseEntity.ok(
                ApiResponse.<List<ProposalResponse>>builder()
                        .success(true)
                        .message("Proposals retrieved successfully")
                        .data(proposals)
                        .build());
    }

    /**
     * Get proposal by ID
     * GET /api/v1/proposals/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<ProposalResponse>> getProposalById(@PathVariable String id) {
        log.info("Fetching proposal with ID: {}", id);

        ProposalResponse proposal = proposalService.getProposalById(id);

        return ResponseEntity.ok(
                ApiResponse.<ProposalResponse>builder()
                        .success(true)
                        .message("Proposal retrieved successfully")
                        .data(proposal)
                        .build());
    }

    /**
     * Get proposals by source (Lead or Opportunity)
     * GET /api/v1/proposals/source/{source}/{sourceId}
     */
    @GetMapping("/source/{source}/{sourceId}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getProposalsBySource(
            @PathVariable ProposalSource source,
            @PathVariable String sourceId) {

        log.info("Fetching proposals for source: {} with ID: {}", source, sourceId);

        List<ProposalResponse> proposals = proposalService.getProposalsBySource(source, sourceId);

        return ResponseEntity.ok(
                ApiResponse.<List<ProposalResponse>>builder()
                        .success(true)
                        .message("Proposals retrieved successfully")
                        .data(proposals)
                        .build());
    }

    /**
     * Get proposals by status
     * GET /api/v1/proposals/status/{status}
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getProposalsByStatus(
            @PathVariable ProposalStatus status) {

        log.info("Fetching proposals with status: {}", status);

        List<ProposalResponse> proposals = proposalService.getProposalsByStatus(status);

        return ResponseEntity.ok(
                ApiResponse.<List<ProposalResponse>>builder()
                        .success(true)
                        .message("Proposals retrieved successfully")
                        .data(proposals)
                        .build());
    }

    /**
     * Get proposals by owner
     * GET /api/v1/proposals/owner/{ownerId}
     */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<List<ProposalResponse>>> getProposalsByOwner(
            @PathVariable String ownerId) {

        log.info("Fetching proposals for owner: {}", ownerId);

        List<ProposalResponse> proposals = proposalService.getProposalsByOwner(ownerId);

        return ResponseEntity.ok(
                ApiResponse.<List<ProposalResponse>>builder()
                        .success(true)
                        .message("Proposals retrieved successfully")
                        .data(proposals)
                        .build());
    }

    /**
     * Send proposal to customer
     * POST /api/v1/proposals/{id}/send
     */
    @PostMapping("/{id}/send")
    @PreAuthorize("hasPermission('PROPOSAL', 'EDIT')")
    public ResponseEntity<ApiResponse<ProposalResponse>> sendProposal(
            @PathVariable String id,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} sending proposal {}", currentUserId, id);

        ProposalResponse proposal = proposalService.sendProposal(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ProposalResponse>builder()
                        .success(true)
                        .message("Proposal sent successfully")
                        .data(proposal)
                        .build());
    }

    /**
     * Accept proposal
     * POST /api/v1/proposals/{id}/accept
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasPermission('PROPOSAL', 'EDIT')")
    public ResponseEntity<ApiResponse<ProposalResponse>> acceptProposal(
            @PathVariable String id,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} accepting proposal {}", currentUserId, id);

        ProposalResponse proposal = proposalService.acceptProposal(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ProposalResponse>builder()
                        .success(true)
                        .message("Proposal accepted successfully")
                        .data(proposal)
                        .build());
    }

    /**
     * Reject proposal
     * POST /api/v1/proposals/{id}/reject
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasPermission('PROPOSAL', 'EDIT')")
    public ResponseEntity<ApiResponse<ProposalResponse>> rejectProposal(
            @PathVariable String id,
            @RequestParam String reason,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} rejecting proposal {} with reason: {}", currentUserId, id, reason);

        ProposalResponse proposal = proposalService.rejectProposal(id, reason, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ProposalResponse>builder()
                        .success(true)
                        .message("Proposal rejected successfully")
                        .data(proposal)
                        .build());
    }

    /**
     * Delete proposal (soft delete)
     * DELETE /api/v1/proposals/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PROPOSAL', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteProposal(
            @PathVariable String id,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} deleting proposal {}", currentUserId, id);

        proposalService.deleteProposal(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Proposal deleted successfully")
                        .build());
    }
}
