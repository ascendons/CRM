package com.ultron.backend.domain.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "drive_folders")
public class DriveFolder {
    @Id private String id;
    @Indexed(unique = true) private String folderId;
    @Indexed private String tenantId;
    private String name;
    private String parentFolderId;
    private List<String> ownerIds;
    private boolean isShared;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
