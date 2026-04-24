package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.TermsType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTermsTemplateRequest {

    @NotNull(message = "Type is required")
    private TermsType type;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Content is required")
    private String content;

    private boolean isDefault;
}
