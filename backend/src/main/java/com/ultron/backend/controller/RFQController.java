package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.domain.entity.RFQ;
import com.ultron.backend.domain.enums.RFQStatus;
import com.ultron.backend.dto.request.ConvertRfqToPoRequest;
import com.ultron.backend.dto.request.CreateRFQRequest;
import com.ultron.backend.dto.request.RecordVendorResponseRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.RFQService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rfqs")
@RequiredArgsConstructor
@Slf4j
public class RFQController {

    private final RFQService rfqService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RFQ>> create(@Valid @RequestBody CreateRFQRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("RFQ created", rfqService.create(request)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<RFQ>>> getAll(
            @RequestParam(required = false) RFQStatus status) {
        List<RFQ> result = status != null ? rfqService.getByStatus(status) : rfqService.getAll();
        return ResponseEntity.ok(ApiResponse.success("RFQs retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RFQ>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("RFQ retrieved", rfqService.getById(id)));
    }

    /** Get all RFQs linked to a source proposal */
    @GetMapping("/by-proposal/{proposalId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<RFQ>>> getByProposal(@PathVariable String proposalId) {
        return ResponseEntity.ok(ApiResponse.success("RFQs retrieved",
                rfqService.getBySourceProposal(proposalId)));
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RFQ>> send(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("RFQ sent", rfqService.send(id)));
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RFQ>> recordVendorResponse(
            @PathVariable String id,
            @Valid @RequestBody RecordVendorResponseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Response recorded",
                rfqService.recordVendorResponse(id, request)));
    }

    @PostMapping("/{id}/convert-to-po")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchaseOrder>> convertToPo(
            @PathVariable String id,
            @Valid @RequestBody ConvertRfqToPoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase Order created",
                        rfqService.convertToPo(id, request)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RFQ>> cancel(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("RFQ cancelled", rfqService.cancel(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        rfqService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("RFQ deleted", null));
    }
}
