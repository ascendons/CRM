package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.KbArticleStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateKbArticleRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String categoryId;
    private String body;
    private KbArticleStatus status;
    private List<String> tags;
    private List<String> searchKeywords;
}
