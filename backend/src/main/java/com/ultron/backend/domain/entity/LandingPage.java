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
@Document(collection = "landing_pages")
public class LandingPage {

    @Id
    private String id;

    @Indexed(unique = true)
    private String pageId;

    @Indexed
    private String tenantId;

    @Indexed(unique = true)
    private String slug;

    private String title;
    private String heroText;
    private String ctaText;
    private String formId;
    private String heroImageUrl;
    private boolean published;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
