package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * MongoDB sequence generator for auto-incrementing IDs
 * Used by ID generator services for tenant-aware sequential ID generation
 */
@Document(collection = "sequences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sequence {

    @Id
    private String id;

    private Long sequence;
}
