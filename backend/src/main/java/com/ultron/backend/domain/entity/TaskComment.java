package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "task_comments")
public class TaskComment {

    @Id
    private String id;

    @Indexed(unique = true)
    private String commentId;

    @Indexed
    private String tenantId;

    @Indexed
    private String taskId;

    private String authorId;
    private String body;
    private List<String> mentions;
    private LocalDateTime createdAt;
}
