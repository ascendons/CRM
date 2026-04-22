package com.ultron.backend.domain.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "drive_files")
public class DriveFile {
    @Id private String id;
    @Indexed(unique = true) private String fileId;
    @Indexed private String tenantId;
    private String folderId;
    private String name;
    private String mimeType;
    private Long sizeBytes;
    private String storageKey;
    private Integer currentVersionNumber;
    private List<String> sharedWith;
    private String linkedEntityType;
    private String linkedEntityId;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
