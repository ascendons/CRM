package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.ProductStatus;
import com.ultron.backend.dto.request.CreateProductRequest;
import com.ultron.backend.dto.request.UpdateProductRequest;
import com.ultron.backend.dto.response.ProductResponse;
import com.ultron.backend.exception.DuplicateResourceException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ProductRepository;
import com.ultron.backend.repository.ProposalRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService extends BaseTenantService {

    private final ProductRepository productRepository;
    private final ProductIdGeneratorService productIdGeneratorService;
    private final UserRepository userRepository;
    private final ProposalRepository proposalRepository;

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request, String createdBy) {
        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        log.info("[Tenant: {}] Creating product for SKU: {}", tenantId, request.getSku());

        // Check if SKU already exists within this tenant
        if (productRepository.existsBySkuAndTenantIdAndIsDeletedFalse(request.getSku(), tenantId)) {
            throw new DuplicateResourceException("Product with SKU " + request.getSku() + " already exists in your organization");
        }

        String productId = productIdGeneratorService.generateProductId();

        Product product = Product.builder()
                .productId(productId)
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
                .sku(request.getSku())
                .productName(request.getProductName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .listPrice(request.getListPrice())
                .discount(request.getDiscount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .unit(request.getUnit())
                .taxRate(request.getTaxRate())
                .taxType(request.getTaxType())
                .category(request.getCategory())
                .subcategory(request.getSubcategory())
                .tags(request.getTags())
                .stockQuantity(request.getStockQuantity())
                .minStockLevel(request.getMinStockLevel())
                .maxStockLevel(request.getMaxStockLevel())
                .reorderLevel(request.getReorderLevel())
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .createdByName(getUserName(createdBy))
                .build();

        Product saved = productRepository.save(product);
        log.info("Product created successfully with ID: {}", saved.getProductId());

        return mapToResponse(saved);
    }

    /**
     * Get all products for current tenant
     */
    public List<ProductResponse> getAllProducts() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all products", tenantId);
        return productRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all products (paginated)", tenantId);
        return productRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get active products within current tenant
     */
    public List<ProductResponse> getActiveProducts() {
        String tenantId = getCurrentTenantId();
        return productRepository.findActiveProductsByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductResponse> getActiveProducts(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return productRepository.findActiveProductsByTenantId(tenantId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get product by ID within current tenant
     */
    public ProductResponse getProductById(String id) {
        String tenantId = getCurrentTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (product.getIsDeleted()) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }

        return mapToResponse(product);
    }

    /**
     * Get product by productId (PRD-YYYY-MM-XXXXX) within current tenant
     */
    public ProductResponse getProductByProductId(String productId) {
        String tenantId = getCurrentTenantId();
        Product product = productRepository.findByProductIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with productId: " + productId));

        if (product.getIsDeleted()) {
            throw new ResourceNotFoundException("Product not found with productId: " + productId);
        }

        return mapToResponse(product);
    }

    /**
     * Get products by category within current tenant
     */
    public List<ProductResponse> getProductsByCategory(String category) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByCategoryAndTenantIdAndIsDeletedFalse(category, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductResponse> getProductsByCategory(String category, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return productRepository.findByCategoryAndTenantIdAndIsDeletedFalse(category, tenantId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Search products within current tenant
     */
    public List<ProductResponse> searchProducts(String searchTerm) {
        String tenantId = getCurrentTenantId();
        return productRepository.searchProductsByTenantId(searchTerm, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductResponse> searchProducts(String searchTerm, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return productRepository.searchProductsByTenantId(searchTerm, tenantId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public ProductResponse updateProduct(String id, UpdateProductRequest request, String modifiedBy) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating product {} by user {}", tenantId, id, modifiedBy);

        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (product.getIsDeleted()) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }

        // Update only non-null fields
        if (request.getProductName() != null) {
            product.setProductName(request.getProductName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getBasePrice() != null) {
            product.setBasePrice(request.getBasePrice());
        }
        if (request.getListPrice() != null) {
            product.setListPrice(request.getListPrice());
        }
        if (request.getDiscount() != null) {
            product.setDiscount(request.getDiscount());
        }
        if (request.getUnit() != null) {
            product.setUnit(request.getUnit());
        }
        if (request.getTaxRate() != null) {
            product.setTaxRate(request.getTaxRate());
        }
        if (request.getTaxType() != null) {
            product.setTaxType(request.getTaxType());
        }
        if (request.getCategory() != null) {
            product.setCategory(request.getCategory());
        }
        if (request.getSubcategory() != null) {
            product.setSubcategory(request.getSubcategory());
        }
        if (request.getTags() != null) {
            product.setTags(request.getTags());
        }
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
            // Sync isActive with Status
            if (request.getStatus() == ProductStatus.DISCONTINUED) {
                product.setIsActive(false);
            } else {
                product.setIsActive(true);
            }
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }
        if (request.getMinStockLevel() != null) {
            product.setMinStockLevel(request.getMinStockLevel());
        }
        if (request.getMaxStockLevel() != null) {
            product.setMaxStockLevel(request.getMaxStockLevel());
        }
        if (request.getReorderLevel() != null) {
            product.setReorderLevel(request.getReorderLevel());
        }

        product.setLastModifiedAt(LocalDateTime.now());
        product.setLastModifiedBy(modifiedBy);
        product.setLastModifiedByName(getUserName(modifiedBy));

        Product updated = productRepository.save(product);
        log.info("Product {} updated successfully", id);

        return mapToResponse(updated);
    }

    /**
     * Delete product (soft delete)
     */
    @Transactional
    public void deleteProduct(String id, String deletedBy) {
        String tenantId = getCurrentTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (product.getIsDeleted()) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }

        // Check if product is referenced in active proposals (DRAFT or SENT status)
        var activeProposals = proposalRepository.findActiveProposalsByProductId(id);
        if (!activeProposals.isEmpty()) {
            throw new IllegalStateException(
                String.format("Cannot delete product. It is referenced in %d active proposal(s)",
                    activeProposals.size())
            );
        }

        // Soft delete
        product.setIsDeleted(true);
        product.setStatus(ProductStatus.DISCONTINUED);
        product.setIsActive(false);
        product.setLastModifiedAt(LocalDateTime.now());
        product.setLastModifiedBy(deletedBy);
        product.setLastModifiedByName(getUserName(deletedBy));

        productRepository.save(product);
        log.info("Product {} soft deleted by user {}", id, deletedBy);
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .productId(product.getProductId())
                .sku(product.getSku())
                .productName(product.getProductName())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .listPrice(product.getListPrice())
                .discount(product.getDiscount())
                .currency(product.getCurrency())
                .unit(product.getUnit())
                .taxRate(product.getTaxRate())
                .taxType(product.getTaxType())
                .category(product.getCategory())
                .subcategory(product.getSubcategory())
                .tags(product.getTags())
                .stockQuantity(product.getStockQuantity())
                .minStockLevel(product.getMinStockLevel())
                .maxStockLevel(product.getMaxStockLevel())
                .reorderLevel(product.getReorderLevel())
                .status(product.getStatus())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt())
                .createdBy(product.getCreatedBy())
                .createdByName(product.getCreatedByName())
                .lastModifiedAt(product.getLastModifiedAt())
                .lastModifiedBy(product.getLastModifiedBy())
                .lastModifiedByName(product.getLastModifiedByName())
                .build();
    }

    private String getUserName(String userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getProfile() != null && user.getProfile().getFullName() != null) {
                        return user.getProfile().getFullName();
                    }
                    return user.getUsername();
                })
                .orElse("Unknown");
    }
}
