package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.WorkOrderChecklist;
import com.ultron.backend.domain.entity.WorkOrderChecklistResponse;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.ChecklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/checklists")
@RequiredArgsConstructor
@Slf4j
public class ChecklistController {

    private final ChecklistService checklistService;

    // --- Templates ---

    @PostMapping("/templates")
    @PreAuthorize("hasPermission('SETTINGS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderChecklist>> createTemplate(
            @RequestBody WorkOrderChecklist template) {
        return ResponseEntity.ok(ApiResponse.success("Template created", 
                checklistService.createTemplate(template, getCurrentUserId())));
    }

    @GetMapping("/templates")
    @PreAuthorize("hasPermission('SETTINGS', 'READ')")
    public ResponseEntity<ApiResponse<List<WorkOrderChecklist>>> getAllTemplates() {
        return ResponseEntity.ok(ApiResponse.success("Templates retrieved", checklistService.getAllTemplates()));
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("hasPermission('SETTINGS', 'READ')")
    public ResponseEntity<ApiResponse<WorkOrderChecklist>> getTemplateById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Template retrieved", checklistService.getTemplateById(id)));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasPermission('SETTINGS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderChecklist>> updateTemplate(
            @PathVariable String id,
            @RequestBody WorkOrderChecklist template) {
        return ResponseEntity.ok(ApiResponse.success("Template updated", 
                checklistService.updateTemplate(id, template, getCurrentUserId())));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasPermission('SETTINGS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable String id) {
        checklistService.deleteTemplate(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Template deleted", null));
    }

    // --- Responses / Execution ---

    @GetMapping("/responses/work-order/{woId}")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'READ')")
    public ResponseEntity<ApiResponse<WorkOrderChecklistResponse>> getResponseByWorkOrder(@PathVariable String woId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Checklist response retrieved", 
                    checklistService.getResponseByWorkOrder(woId)));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success("No response found", null));
        }
    }

    @PostMapping("/responses/work-order/{woId}/start")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderChecklistResponse>> startChecklist(
            @PathVariable String woId,
            @RequestBody Map<String, String> body) {
        String templateId = body.get("templateId");
        String engineerId = body.get("engineerId");
        return ResponseEntity.ok(ApiResponse.success("Checklist started", 
                checklistService.startChecklist(woId, templateId, engineerId, getCurrentUserId())));
    }

    @PostMapping("/responses/work-order/{woId}/save")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderChecklistResponse>> saveResponses(
            @PathVariable String woId,
            @RequestBody List<WorkOrderChecklistResponse.ItemResponse> responses) {
        return ResponseEntity.ok(ApiResponse.success("Responses saved", 
                checklistService.saveResponses(woId, responses, getCurrentUserId())));
    }

    @PostMapping("/responses/work-order/{woId}/complete")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderChecklistResponse>> completeChecklist(@PathVariable String woId) {
        return ResponseEntity.ok(ApiResponse.success("Checklist completed", 
                checklistService.completeChecklist(woId, getCurrentUserId())));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
