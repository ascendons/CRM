package com.ultron.backend.service;

import com.ultron.backend.domain.entity.DriveFile;
import com.ultron.backend.domain.entity.DriveFileVersion;
import com.ultron.backend.domain.entity.DriveFolder;
import com.ultron.backend.repository.DriveFileRepository;
import com.ultron.backend.repository.DriveFileVersionRepository;
import com.ultron.backend.repository.DriveFolderRepository;
import com.ultron.backend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class DriveService extends BaseTenantService {
    private final DriveFolderRepository folderRepo;
    private final DriveFileRepository fileRepo;
    private final DriveFileVersionRepository versionRepo;
    private final StorageService storageService;

    public DriveFolder createFolder(String name, String parentFolderId, String userId) {
        String tenantId = getCurrentTenantId();
        DriveFolder folder = DriveFolder.builder()
                .folderId("DF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tenantId(tenantId).name(name).parentFolderId(parentFolderId)
                .isShared(false).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy(userId)
                .updatedAt(LocalDateTime.now()).updatedBy(userId).build();
        return folderRepo.save(folder);
    }

    public List<DriveFolder> getFolders(String parentId) {
        String tenantId = getCurrentTenantId();
        if (parentId == null || parentId.isEmpty())
            return folderRepo.findByTenantIdAndParentFolderIdIsNullAndIsDeletedFalse(tenantId);
        return folderRepo.findByTenantIdAndParentFolderIdAndIsDeletedFalse(tenantId, parentId);
    }

    public List<DriveFile> getFiles(String folderId) {
        String tenantId = getCurrentTenantId();
        if (folderId == null || folderId.isEmpty())
            return fileRepo.findByTenantIdAndFolderIdIsNullAndIsDeletedFalse(tenantId);
        return fileRepo.findByTenantIdAndFolderIdAndIsDeletedFalse(tenantId, folderId);
    }

    public DriveFile uploadFile(MultipartFile file, String folderId, String userId) throws IOException {
        String tenantId = getCurrentTenantId();
        String fileId = "FILE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String key = tenantId + "/" + fileId + "/" + file.getOriginalFilename();
        storageService.uploadFile(key, file.getInputStream(), file.getSize());

        DriveFile driveFile = DriveFile.builder()
                .fileId(fileId).tenantId(tenantId).folderId(folderId)
                .name(file.getOriginalFilename()).mimeType(file.getContentType())
                .sizeBytes(file.getSize()).storageKey(key).currentVersionNumber(1)
                .isDeleted(false).createdAt(LocalDateTime.now()).createdBy(userId)
                .updatedAt(LocalDateTime.now()).updatedBy(userId).build();
        driveFile = fileRepo.save(driveFile);

        DriveFileVersion version = DriveFileVersion.builder()
                .versionId("VER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tenantId(tenantId).fileId(driveFile.getFileId()).versionNumber(1)
                .storageKey(key).uploadedBy(userId).uploadedAt(LocalDateTime.now())
                .sizeBytes(file.getSize()).build();
        versionRepo.save(version);
        return driveFile;
    }

    public String getDownloadUrl(String fileId) {
        DriveFile file = fileRepo.findByFileIdAndTenantIdAndIsDeletedFalse(fileId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("File not found"));
        return storageService.getFileUrl(file.getStorageKey());
    }

    public void deleteFile(String fileId, String userId) {
        DriveFile file = fileRepo.findByFileIdAndTenantIdAndIsDeletedFalse(fileId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("File not found"));
        file.setDeleted(true); file.setUpdatedAt(LocalDateTime.now()); file.setUpdatedBy(userId);
        fileRepo.save(file);
    }

    public List<DriveFileVersion> getVersions(String fileId) {
        return versionRepo.findByFileIdOrderByVersionNumberDesc(fileId);
    }
}
