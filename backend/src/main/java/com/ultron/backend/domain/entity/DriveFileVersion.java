package com.ultron.backend.domain.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "drive_file_versions")
public class DriveFileVersion {
    @Id private String id;
    @Indexed(unique = true) private String versionId;
    @Indexed private String tenantId;
    private String fileId;
    private Integer versionNumber;
    private String storageKey;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
    private Long sizeBytes;
}
