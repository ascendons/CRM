package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.ContractVisit;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.ContractVisitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class ContractVisitController {

    private final ContractVisitService visitService;

    @GetMapping("/{id}/visits")
    @PreAuthorize("hasPermission('CONTRACTS', 'READ')")
    public ResponseEntity<ApiResponse<List<ContractVisit>>> getVisits(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Contract visits retrieved", visitService.getByContract(id)));
    }

    @PutMapping("/visits/{visitId}")
    @PreAuthorize("hasPermission('CONTRACTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ContractVisit>> updateVisit(
            @PathVariable String visitId,
            @RequestBody ContractVisit visit) {
        return ResponseEntity.ok(ApiResponse.success("Visit updated", 
                visitService.updateVisit(visitId, visit, getCurrentUserId())));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
