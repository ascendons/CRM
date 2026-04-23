package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.DriveFile;
import com.ultron.backend.domain.entity.DriveFileVersion;
import com.ultron.backend.domain.entity.DriveFolder;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.DriveService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController @RequestMapping("/drive") @RequiredArgsConstructor
public class DriveController {
    private final DriveService driveService;

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @GetMapping("/folders")
    @PreAuthorize("hasPermission('DRIVE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<DriveFolder>>> getFolders(@RequestParam(required = false) String parentId) {
        return ResponseEntity.ok(ApiResponse.<List<DriveFolder>>builder().success(true).data(driveService.getFolders(parentId)).build());
    }

    @PostMapping("/folders")
    @PreAuthorize("hasPermission('DRIVE', 'CREATE')")
    public ResponseEntity<ApiResponse<DriveFolder>> createFolder(@RequestBody CreateFolderRequest req) {
        return ResponseEntity.ok(ApiResponse.<DriveFolder>builder().success(true).data(driveService.createFolder(req.getName(), req.getParentFolderId(), currentUserId())).build());
    }

    @GetMapping("/files")
    @PreAuthorize("hasPermission('DRIVE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<DriveFile>>> getFiles(@RequestParam(required = false) String folderId) {
        return ResponseEntity.ok(ApiResponse.<List<DriveFile>>builder().success(true).data(driveService.getFiles(folderId)).build());
    }

    @PostMapping("/files/upload")
    @PreAuthorize("hasPermission('DRIVE', 'CREATE')")
    public ResponseEntity<ApiResponse<DriveFile>> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam(required = false) String folderId) throws Exception {
        return ResponseEntity.ok(ApiResponse.<DriveFile>builder().success(true).data(driveService.uploadFile(file, folderId, currentUserId())).build());
    }

    @GetMapping("/files/{id}/download")
    @PreAuthorize("hasPermission('DRIVE', 'VIEW')")
    public ResponseEntity<ApiResponse<String>> download(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<String>builder().success(true).data(driveService.getDownloadUrl(id)).build());
    }

    @DeleteMapping("/files/{id}")
    @PreAuthorize("hasPermission('DRIVE', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable String id) {
        driveService.deleteFile(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @GetMapping("/files/{id}/versions")
    @PreAuthorize("hasPermission('DRIVE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<DriveFileVersion>>> getVersions(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<List<DriveFileVersion>>builder().success(true).data(driveService.getVersions(id)).build());
    }

    @Data
    public static class CreateFolderRequest {
        private String name;
        private String parentFolderId;
    }
}
