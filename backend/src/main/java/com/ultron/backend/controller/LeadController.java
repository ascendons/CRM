package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.LeadStatus;
import com.ultron.backend.dto.request.CreateLeadRequest;
import com.ultron.backend.dto.request.UpdateLeadRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.LeadResponse;
import com.ultron.backend.service.LeadService;
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
@RequestMapping("/leads")
@RequiredArgsConstructor
@Slf4j
public class LeadController {

    private final LeadService leadService;

    /**
     * Create a new lead
     * POST /api/v1/leads
     */
    @PostMapping
    @PreAuthorize("hasPermission('LEAD', 'CREATE')")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(
            @Valid @RequestBody CreateLeadRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new lead for: {}", currentUserId, request.getEmail());

        LeadResponse lead = leadService.createLead(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<LeadResponse>builder()
                        .success(true)
                        .message("Lead created successfully")
                        .data(lead)
                        .build());
    }

    /**
     * Get all leads
     * GET /api/v1/leads
     */
    @GetMapping
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getAllLeads() {
        log.info("Fetching all leads");

        List<LeadResponse> leads = leadService.getAllLeads();

        return ResponseEntity.ok(
                ApiResponse.<List<LeadResponse>>builder()
                        .success(true)
                        .message("Leads retrieved successfully")
                        .data(leads)
                        .build());
    }

    /**
     * Get lead by ID
     * GET /api/v1/leads/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(@PathVariable String id) {
        log.info("Fetching lead with ID: {}", id);

        LeadResponse lead = leadService.getLeadById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        return ResponseEntity.ok(
                ApiResponse.<LeadResponse>builder()
                        .success(true)
                        .message("Lead retrieved successfully")
                        .data(lead)
                        .build());
    }

    /**
     * Get lead by leadId (LEAD-YYYY-MM-XXXXX)
     * GET /api/v1/leads/code/{leadId}
     */
    @GetMapping("/code/{leadId}")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadByLeadId(@PathVariable String leadId) {
        log.info("Fetching lead with leadId: {}", leadId);

        LeadResponse lead = leadService.getLeadByLeadId(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found with leadId: " + leadId));

        return ResponseEntity.ok(
                ApiResponse.<LeadResponse>builder()
                        .success(true)
                        .message("Lead retrieved successfully")
                        .data(lead)
                        .build());
    }

    /**
     * Get leads by owner
     * GET /api/v1/leads/owner/{ownerId}
     */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getLeadsByOwner(@PathVariable String ownerId) {
        log.info("Fetching leads for owner: {}", ownerId);

        List<LeadResponse> leads = leadService.getLeadsByOwner(ownerId);

        return ResponseEntity.ok(
                ApiResponse.<List<LeadResponse>>builder()
                        .success(true)
                        .message("Leads retrieved successfully")
                        .data(leads)
                        .build());
    }

    /**
     * Get my leads (current user)
     * GET /api/v1/leads/my-leads
     */
    @GetMapping("/my-leads")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getMyLeads() {
        String currentUserId = getCurrentUserId();
        log.info("Fetching leads for current user: {}", currentUserId);

        List<LeadResponse> leads = leadService.getLeadsByOwner(currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<List<LeadResponse>>builder()
                        .success(true)
                        .message("Your leads retrieved successfully")
                        .data(leads)
                        .build());
    }

    /**
     * Get leads by status
     * GET /api/v1/leads/status/{status}
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getLeadsByStatus(
            @PathVariable LeadStatus status) {

        log.info("Fetching leads with status: {}", status);

        List<LeadResponse> leads = leadService.getLeadsByStatus(status);

        return ResponseEntity.ok(
                ApiResponse.<List<LeadResponse>>builder()
                        .success(true)
                        .message("Leads retrieved successfully")
                        .data(leads)
                        .build());
    }

    /**
     * Search leads
     * GET /api/v1/leads/search?q=searchTerm
     */
    @GetMapping("/search")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> searchLeads(
            @RequestParam("q") String searchTerm) {

        log.info("Searching leads with term: {}", searchTerm);

        List<LeadResponse> leads = leadService.searchLeads(searchTerm);

        return ResponseEntity.ok(
                ApiResponse.<List<LeadResponse>>builder()
                        .success(true)
                        .message("Search results retrieved successfully")
                        .data(leads)
                        .build());
    }

    /**
     * Update lead information
     * PUT /api/v1/leads/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('LEAD', 'EDIT')")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLead(
            @PathVariable String id,
            @Valid @RequestBody UpdateLeadRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating lead {}", currentUserId, id);

        LeadResponse lead = leadService.updateLead(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<LeadResponse>builder()
                        .success(true)
                        .message("Lead updated successfully")
                        .data(lead)
                        .build());
    }

    /**
     * Update lead status
     * PUT /api/v1/leads/{id}/status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasPermission('LEAD', 'EDIT')")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadStatus(
            @PathVariable String id,
            @RequestParam LeadStatus status) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating lead {} status to {}", currentUserId, id, status);

        LeadResponse lead = leadService.updateLeadStatus(id, status, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<LeadResponse>builder()
                        .success(true)
                        .message("Lead status updated successfully")
                        .data(lead)
                        .build());
    }

    /**
     * Convert lead to opportunity
     * POST /api/v1/leads/{id}/convert
     */
    @PostMapping("/{id}/convert")
    @PreAuthorize("hasPermission('LEAD', 'EDIT')")
    public ResponseEntity<ApiResponse<LeadResponse>> convertLead(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} converting lead {}", currentUserId, id);

        LeadResponse lead = leadService.convertLead(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<LeadResponse>builder()
                        .success(true)
                        .message("Lead converted successfully")
                        .data(lead)
                        .build());
    }

    /**
     * Delete lead (soft delete)
     * DELETE /api/v1/leads/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('LEAD', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} deleting lead {}", currentUserId, id);

        leadService.deleteLead(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Lead deleted successfully")
                        .build());
    }

    /**
     * Get lead statistics
     * GET /api/v1/leads/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<LeadService.LeadStatistics>> getStatistics() {
        log.info("Fetching lead statistics");

        LeadService.LeadStatistics stats = leadService.getStatistics();

        return ResponseEntity.ok(
                ApiResponse.<LeadService.LeadStatistics>builder()
                        .success(true)
                        .message("Statistics retrieved successfully")
                        .data(stats)
                        .build());
    }

    /**
     * Get current user ID from security context
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName(); // This is the userId we set in JWT
    }
}
