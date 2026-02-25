package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import com.ultron.backend.dto.request.CreateProposalRequest;
import com.ultron.backend.dto.request.UpdateProposalRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProposalResponse;
import com.ultron.backend.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final com.ultron.backend.service.ProposalVersioningService proposalVersioningService;

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
     * Get all proposals (with optional pagination)
     * GET /api/v1/proposals
     * Supports pagination with query params: page, size, sort
     */
    @GetMapping
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<?>> getAllProposals(Pageable pageable) {
        log.info("Fetching all proposals (pageable: {})", pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProposalResponse> proposals = proposalService.getAllProposals(pageable);
            return ResponseEntity.ok(
                    ApiResponse.<Page<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        } else {
            List<ProposalResponse> proposals = proposalService.getAllProposals();
            return ResponseEntity.ok(
                    ApiResponse.<List<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        }
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
     * Get proposal PDF invoice
     * GET /api/v1/proposals/{id}/pdf
     */
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<byte[]> getProposalPdf(@PathVariable String id) {
        log.info("Generating PDF for proposal: {}", id);

        // Get proposal details to set filename
        ProposalResponse proposal = proposalService.getProposalById(id);
        
        byte[] pdfBytes = proposalService.generatePdf(id);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"proposal-" + proposal.getProposalNumber() + ".pdf\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Preview invoice HTML using template
     * GET /api/v1/proposals/{id}/invoice/preview
     */
    @GetMapping("/{id}/invoice/preview")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<String> previewInvoiceHtml(
            @PathVariable String id,
            @RequestParam(defaultValue = "PROFORMA") com.ultron.backend.domain.enums.InvoiceTemplateType template
    ) {
        log.info("Generating HTML preview for proposal {} with template {}", id, template);

        String html = proposalService.generateInvoiceHtml(id, template);

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.TEXT_HTML)
                .body(html);
    }

    /**
     * Download invoice PDF using template
     * GET /api/v1/proposals/{id}/invoice/download
     */
    @GetMapping("/{id}/invoice/download")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable String id,
            @RequestParam(defaultValue = "PROFORMA") com.ultron.backend.domain.enums.InvoiceTemplateType template
    ) {
        log.info("Generating PDF for proposal {} with template {}", id, template);

        // Get proposal details for filename
        ProposalResponse proposal = proposalService.getProposalById(id);
        byte[] pdfBytes = proposalService.generateInvoicePdf(id, template);

        String filename = String.format("invoice-%s-%s.pdf",
                proposal.getProposalNumber(),
                template.name().toLowerCase());

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Get available invoice templates
     * GET /api/v1/proposals/{id}/invoice/templates
     */
    @GetMapping("/{id}/invoice/templates")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getAvailableTemplates(
            @PathVariable String id
    ) {
        log.info("Fetching available templates for proposal {}", id);

        java.util.List<java.util.Map<String, Object>> templates = new java.util.ArrayList<>();

        for (com.ultron.backend.domain.enums.InvoiceTemplateType type : com.ultron.backend.domain.enums.InvoiceTemplateType.values()) {
            java.util.Map<String, Object> templateInfo = new java.util.HashMap<>();
            templateInfo.put("type", type.name());
            templateInfo.put("displayName", type.getDisplayName());
            templateInfo.put("description", type.getDescription());
            templateInfo.put("available", type == com.ultron.backend.domain.enums.InvoiceTemplateType.PROFORMA); // Only PROFORMA available for now
            templates.add(templateInfo);
        }

        return ResponseEntity.ok(
                ApiResponse.<java.util.List<java.util.Map<String, Object>>>builder()
                        .success(true)
                        .message("Available templates retrieved successfully")
                        .data(templates)
                        .build());
    }

    /**
     * Get proposals by source (Lead or Opportunity) (with optional pagination)
     * GET /api/v1/proposals/source/{source}/{sourceId}
     * Supports pagination with query params: page, size, sort
     */
    @GetMapping("/source/{source}/{sourceId}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<?>> getProposalsBySource(
            @PathVariable ProposalSource source,
            @PathVariable String sourceId,
            Pageable pageable) {

        log.info("Fetching proposals for source: {} with ID: {} (pageable: {})", source, sourceId, pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProposalResponse> proposals = proposalService.getProposalsBySource(source, sourceId, pageable);
            return ResponseEntity.ok(
                    ApiResponse.<Page<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        } else {
            List<ProposalResponse> proposals = proposalService.getProposalsBySource(source, sourceId);
            return ResponseEntity.ok(
                    ApiResponse.<List<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        }
    }

    /**
     * Get proposals by status (with optional pagination)
     * GET /api/v1/proposals/status/{status}
     * Supports pagination with query params: page, size, sort
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<?>> getProposalsByStatus(
            @PathVariable ProposalStatus status,
            Pageable pageable) {

        log.info("Fetching proposals with status: {} (pageable: {})", status, pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProposalResponse> proposals = proposalService.getProposalsByStatus(status, pageable);
            return ResponseEntity.ok(
                    ApiResponse.<Page<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        } else {
            List<ProposalResponse> proposals = proposalService.getProposalsByStatus(status);
            return ResponseEntity.ok(
                    ApiResponse.<List<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        }
    }

    /**
     * Get proposals by owner (with optional pagination)
     * GET /api/v1/proposals/owner/{ownerId}
     * Supports pagination with query params: page, size, sort
     */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<?>> getProposalsByOwner(
            @PathVariable String ownerId,
            Pageable pageable) {

        log.info("Fetching proposals for owner: {} (pageable: {})", ownerId, pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProposalResponse> proposals = proposalService.getProposalsByOwner(ownerId, pageable);
            return ResponseEntity.ok(
                    ApiResponse.<Page<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        } else {
            List<ProposalResponse> proposals = proposalService.getProposalsByOwner(ownerId);
            return ResponseEntity.ok(
                    ApiResponse.<List<ProposalResponse>>builder()
                            .success(true)
                            .message("Proposals retrieved successfully")
                            .data(proposals)
                            .build());
        }
    }

    /**
     * Update an existing proposal (DRAFT only)
     * PUT /api/v1/proposals/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('PROPOSAL', 'EDIT')")
    public ResponseEntity<ApiResponse<ProposalResponse>> updateProposal(
            @PathVariable String id,
            @Valid @RequestBody UpdateProposalRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} updating proposal {}", currentUserId, id);

        ProposalResponse proposal = proposalService.updateProposal(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ProposalResponse>builder()
                        .success(true)
                        .message("Proposal updated successfully")
                        .data(proposal)
                        .build());
    }

    /**
     * Send proposal to customer
     * POST /api/v1/proposals/{id}/send
     * Requires PROPOSAL:SEND permission (separate from EDIT to allow delegation)
     */
    @PostMapping("/{id}/send")
    @PreAuthorize("hasPermission('PROPOSAL', 'SEND') or hasPermission('PROPOSAL', 'EDIT')")
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
     * Requires PROPOSAL:APPROVE permission (separate from EDIT to prevent conflict of interest)
     * Typically only managers or customers should have this permission
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasPermission('PROPOSAL', 'APPROVE')")
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
     * Requires PROPOSAL:REJECT permission (separate from EDIT to prevent conflict of interest)
     * Typically only managers or customers should have this permission
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasPermission('PROPOSAL', 'REJECT')")
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

    /**
     * Get version history for a proposal
     * GET /api/v1/proposals/{id}/versions
     */
    @GetMapping("/{id}/versions")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<List<com.ultron.backend.dto.response.ProposalVersionResponse>>> getVersionHistory(
            @PathVariable String id) {
        log.info("Fetching version history for proposal: {}", id);

        List<com.ultron.backend.dto.response.ProposalVersionResponse> history = proposalVersioningService.getVersionHistory(id);

        return ResponseEntity.ok(
                ApiResponse.<List<com.ultron.backend.dto.response.ProposalVersionResponse>>builder()
                        .success(true)
                        .message("Version history retrieved successfully")
                        .data(history)
                        .build());
    }

    /**
     * Get a specific version snapshot of a proposal
     * GET /api/v1/proposals/{id}/versions/{version}
     */
    @GetMapping("/{id}/versions/{version}")
    @PreAuthorize("hasPermission('PROPOSAL', 'READ')")
    public ResponseEntity<ApiResponse<com.ultron.backend.dto.response.ProposalVersionResponse>> getVersion(
            @PathVariable String id,
            @PathVariable Integer version) {
        log.info("Fetching version {} for proposal: {}", version, id);

        com.ultron.backend.dto.response.ProposalVersionResponse proposalVersion = proposalVersioningService.getVersion(id, version);

        return ResponseEntity.ok(
                ApiResponse.<com.ultron.backend.dto.response.ProposalVersionResponse>builder()
                        .success(true)
                        .message("Proposal version retrieved successfully")
                        .data(proposalVersion)
                        .build());
    }
}
