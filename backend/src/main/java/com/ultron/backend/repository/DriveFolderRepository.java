package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.DriveFolder;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface DriveFolderRepository extends MongoRepository<DriveFolder, String> {
    List<DriveFolder> findByTenantIdAndParentFolderIdAndIsDeletedFalse(String tenantId, String parentFolderId);
    List<DriveFolder> findByTenantIdAndParentFolderIdIsNullAndIsDeletedFalse(String tenantId);
    Optional<DriveFolder> findByFolderIdAndTenantIdAndIsDeletedFalse(String folderId, String tenantId);
}
