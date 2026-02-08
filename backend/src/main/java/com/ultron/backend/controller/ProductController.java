package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateProductRequest;
import com.ultron.backend.dto.request.UpdateProductRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProductResponse;
import com.ultron.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    /**
     * Create a new product
     * POST /api/v1/products
     */
    @PostMapping
//    @PreAuthorize("hasPermission('PRODUCT', 'CREATE')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} creating new product: {}", currentUserId, request.getSku());

        ProductResponse product = productService.createProduct(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<ProductResponse>builder()
                        .success(true)
                        .message("Product created successfully")
                        .data(product)
                        .build());
    }

    /**
     * Get all products (with optional pagination)
     * GET /api/v1/products
     * Supports pagination with query params: page, size, sort
     * Example: /products?page=0&size=10&sort=productName,asc
     */
    @GetMapping
//    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<?>> getAllProducts(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            Pageable pageable) {

        log.info("Fetching all products (activeOnly: {}, pageable: {})", activeOnly, pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProductResponse> products = activeOnly
                    ? productService.getActiveProducts(pageable)
                    : productService.getAllProducts(pageable);

            return ResponseEntity.ok(
                    ApiResponse.<Page<ProductResponse>>builder()
                            .success(true)
                            .message("Products retrieved successfully")
                            .data(products)
                            .build());
        } else {
            List<ProductResponse> products = activeOnly
                    ? productService.getActiveProducts()
                    : productService.getAllProducts();

            return ResponseEntity.ok(
                    ApiResponse.<List<ProductResponse>>builder()
                            .success(true)
                            .message("Products retrieved successfully")
                            .data(products)
                            .build());
        }
    }

    /**
     * Get product by ID
     * GET /api/v1/products/{id}
     */
    @GetMapping("/{id}")
//    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable String id) {
        log.info("Fetching product with ID: {}", id);

        ProductResponse product = productService.getProductById(id);

        return ResponseEntity.ok(
                ApiResponse.<ProductResponse>builder()
                        .success(true)
                        .message("Product retrieved successfully")
                        .data(product)
                        .build());
    }

    /**
     * Get product by productId (PRD-YYYY-MM-XXXXX)
     * GET /api/v1/products/code/{productId}
     */
    @GetMapping("/code/{productId}")
//    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductByProductId(
            @PathVariable String productId) {

        log.info("Fetching product with productId: {}", productId);

        ProductResponse product = productService.getProductByProductId(productId);

        return ResponseEntity.ok(
                ApiResponse.<ProductResponse>builder()
                        .success(true)
                        .message("Product retrieved successfully")
                        .data(product)
                        .build());
    }

    /**
     * Get products by category (with optional pagination)
     * GET /api/v1/products/category/{category}
     * Supports pagination with query params: page, size, sort
     */
    @GetMapping("/category/{category}")
//    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<?>> getProductsByCategory(
            @PathVariable String category,
            Pageable pageable) {

        log.info("Fetching products for category: {} (pageable: {})", category, pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProductResponse> products = productService.getProductsByCategory(category, pageable);
            return ResponseEntity.ok(
                    ApiResponse.<Page<ProductResponse>>builder()
                            .success(true)
                            .message("Products retrieved successfully")
                            .data(products)
                            .build());
        } else {
            List<ProductResponse> products = productService.getProductsByCategory(category);
            return ResponseEntity.ok(
                    ApiResponse.<List<ProductResponse>>builder()
                            .success(true)
                            .message("Products retrieved successfully")
                            .data(products)
                            .build());
        }
    }

    /**
     * Search products (with optional pagination)
     * GET /api/v1/products/search?q=searchTerm
     * Supports pagination with query params: page, size, sort
     */
    @GetMapping("/search")
//    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<?>> searchProducts(
            @RequestParam("q") String searchTerm,
            Pageable pageable) {

        log.info("Searching products with term: {} (pageable: {})", searchTerm, pageable.isPaged());

        if (pageable.isPaged()) {
            Page<ProductResponse> products = productService.searchProducts(searchTerm, pageable);
            return ResponseEntity.ok(
                    ApiResponse.<Page<ProductResponse>>builder()
                            .success(true)
                            .message("Search results retrieved successfully")
                            .data(products)
                            .build());
        } else {
            List<ProductResponse> products = productService.searchProducts(searchTerm);
            return ResponseEntity.ok(
                    ApiResponse.<List<ProductResponse>>builder()
                            .success(true)
                            .message("Search results retrieved successfully")
                            .data(products)
                            .build());
        }
    }

    /**
     * Update product
     * PUT /api/v1/products/{id}
     */
    @PutMapping("/{id}")
//    @PreAuthorize("hasPermission('PRODUCT', 'EDIT')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody UpdateProductRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} updating product {}", currentUserId, id);

        ProductResponse product = productService.updateProduct(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ProductResponse>builder()
                        .success(true)
                        .message("Product updated successfully")
                        .data(product)
                        .build());
    }

    /**
     * Delete product (soft delete)
     * DELETE /api/v1/products/{id}
     */
    @DeleteMapping("/{id}")
//    @PreAuthorize("hasPermission('PRODUCT', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable String id,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} deleting product {}", currentUserId, id);

        productService.deleteProduct(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Product deleted successfully")
                        .build());
    }
}
