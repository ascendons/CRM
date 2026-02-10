package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.AuditLog;
import com.ultron.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ultron.backend.dto.response.ApiResponse;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("AuditLogController INITIALIZED !!!");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAllLogs(Pageable pageable) {
        return ResponseEntity.ok(
                ApiResponse.<Page<AuditLog>>builder()
                        .success(true)
                        .message("Audit logs retrieved successfully")
                        .data(auditLogService.getAllAuditLogs(pageable))
                        .build());
    }

    @GetMapping("/{entityName}/{entityId}")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getEntityLogs(
            @PathVariable String entityName,
            @PathVariable String entityId,
            Pageable pageable) {
        return ResponseEntity.ok(
                ApiResponse.<Page<AuditLog>>builder()
                        .success(true)
                        .message("Entity audit logs retrieved successfully")
                        .data(auditLogService.getEntityAuditLogs(entityName, entityId, pageable))
                        .build());
    }
}
