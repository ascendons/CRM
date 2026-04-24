package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.TermsType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermsTemplateResponse {

    private String id;
    private String tenantId;
    private TermsType type;
    private String name;
    private String content;
    private boolean isDefault;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
