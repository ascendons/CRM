package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateLandingPageRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Slug is required")
    private String slug;

    private String heroText;
    private String ctaText;
    private String formId;
    private String heroImageUrl;
    private boolean published;
}
