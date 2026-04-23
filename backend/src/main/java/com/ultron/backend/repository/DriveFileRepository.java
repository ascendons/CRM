package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.DriveFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface DriveFileRepository extends MongoRepository<DriveFile, String> {
    List<DriveFile> findByTenantIdAndFolderIdAndIsDeletedFalse(String tenantId, String folderId);
    List<DriveFile> findByTenantIdAndFolderIdIsNullAndIsDeletedFalse(String tenantId);
    Optional<DriveFile> findByFileIdAndTenantIdAndIsDeletedFalse(String fileId, String tenantId);
    List<DriveFile> findByTenantIdAndNameContainingIgnoreCaseAndIsDeletedFalse(String tenantId, String name);
}
