package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.RFQ;
import com.ultron.backend.domain.enums.RFQStatus;
import com.ultron.backend.dto.request.CreateRFQRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.RFQService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/procurement/rfq")
@RequiredArgsConstructor
@Slf4j
public class RFQController {

    private final RFQService rfqService;

    @PostMapping
    @PreAuthorize("hasPermission('PROCUREMENT', 'CREATE')")
    public ResponseEntity<ApiResponse<RFQ>> create(@Valid @RequestBody CreateRFQRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("RFQ created", rfqService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('PROCUREMENT', 'READ')")
    public ResponseEntity<ApiResponse<List<RFQ>>> getAll(
            @RequestParam(required = false) RFQStatus status) {
        List<RFQ> result = status != null ? rfqService.getByStatus(status) : rfqService.getAll();
        return ResponseEntity.ok(ApiResponse.success("RFQs retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PROCUREMENT', 'READ')")
    public ResponseEntity<ApiResponse<RFQ>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("RFQ retrieved", rfqService.getById(id)));
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RFQ>> submitVendorResponse(
            @PathVariable String id, @RequestBody Map<String, Object> body) {
        String vendorId = (String) body.get("vendorId");
        BigDecimal unitPrice = new BigDecimal(body.get("unitPrice").toString());
        Integer deliveryDays = (Integer) body.get("deliveryDays");
        String notes = (String) body.get("notes");
        return ResponseEntity.ok(ApiResponse.success("Response submitted",
                rfqService.submitVendorResponse(id, vendorId, unitPrice, deliveryDays, notes, getCurrentUserId())));
    }

    @PostMapping("/{id}/select-vendor")
    @PreAuthorize("hasPermission('PROCUREMENT', 'APPROVE')")
    public ResponseEntity<ApiResponse<RFQ>> selectVendor(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Vendor selected",
                rfqService.selectVendor(id, body.get("vendorId"), getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PROCUREMENT', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        rfqService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("RFQ deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
