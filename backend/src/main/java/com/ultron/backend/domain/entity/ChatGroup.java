package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_groups")
public class ChatGroup {

    @Id
    private String id;

    private String tenantId;

    private String name;

    @Builder.Default
    private List<String> memberIds = new ArrayList<>();

    private String createdBy;

    private LocalDateTime createdAt;
}
