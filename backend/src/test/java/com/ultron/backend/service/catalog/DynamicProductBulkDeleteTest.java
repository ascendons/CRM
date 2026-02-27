package com.ultron.backend.service.catalog;

import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.DynamicProductRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class DynamicProductBulkDeleteTest {

    @Autowired
    private DynamicProductSearchService searchService;

    @Autowired
    private DynamicProductRepository repository;

    private String tenantId = "test-tenant";

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        repository.deleteAll();
        
        DynamicProduct p1 = DynamicProduct.builder()
                .id("p1")
                .productId("PROD-1")
                .tenantId(tenantId)
                .displayName("Product 1")
                .isDeleted(false)
                .build();

        DynamicProduct p2 = DynamicProduct.builder()
                .id("p2")
                .productId("PROD-2")
                .tenantId(tenantId)
                .displayName("Product 2")
                .isDeleted(false)
                .build();

        repository.saveAll(Arrays.asList(p1, p2));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testBulkSoftDelete() {
        List<String> ids = Arrays.asList("p1", "p2");
        int count = searchService.bulkSoftDelete(ids);

        assertEquals(2, count);
        
        DynamicProduct savedP1 = repository.findById("p1").orElseThrow();
        DynamicProduct savedP2 = repository.findById("p2").orElseThrow();

        assertTrue(savedP1.isDeleted());
        assertTrue(savedP2.isDeleted());
        assertNotNull(savedP1.getDeletedAt());
    }

    @Test
    void testBulkHardDelete() {
        List<String> ids = Arrays.asList("p1", "p2");
        int count = searchService.bulkHardDelete(ids);

        assertEquals(2, count);
        assertFalse(repository.existsById("p1"));
        assertFalse(repository.existsById("p2"));
    }
}
