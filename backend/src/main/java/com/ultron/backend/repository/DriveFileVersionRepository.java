package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.DriveFileVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface DriveFileVersionRepository extends MongoRepository<DriveFileVersion, String> {
    List<DriveFileVersion> findByFileIdOrderByVersionNumberDesc(String fileId);
}
