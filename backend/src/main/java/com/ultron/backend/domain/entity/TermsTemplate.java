package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.TermsType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "terms_templates")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_deleted_idx", def = "{'tenantId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_type_deleted_idx", def = "{'tenantId': 1, 'type': 1, 'isDeleted': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermsTemplate {

    @Id
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
