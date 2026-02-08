package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogPageViewRequest {

    @NotBlank(message = "Page URL is required")
    private String pageUrl;

    @NotBlank(message = "Page title is required")
    private String pageTitle;

    private String previousPage;
    private Long duration; // Time spent on previous page in milliseconds
}
