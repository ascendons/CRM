package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "kb_categories")
public class KbCategory {

    @Id
    private String id;

    @Indexed(unique = true)
    private String categoryId;

    @Indexed
    private String tenantId;

    private String name;
    private String description;
    private String parentCategoryId;
    private String icon;
    private Integer sortOrder;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
