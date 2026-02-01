package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateProductRequest;
import com.ultron.backend.dto.request.UpdateProductRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProductResponse;
import com.ultron.backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    @PreAuthorize("hasPermission('PRODUCT', 'CREATE')")
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
     * Get all products
     * GET /api/v1/products
     */
    @GetMapping
    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {

        log.info("Fetching all products (activeOnly: {})", activeOnly);

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

    /**
     * Get product by ID
     * GET /api/v1/products/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
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
    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
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
     * Get products by category
     * GET /api/v1/products/category/{category}
     */
    @GetMapping("/category/{category}")
    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByCategory(
            @PathVariable String category) {

        log.info("Fetching products for category: {}", category);

        List<ProductResponse> products = productService.getProductsByCategory(category);

        return ResponseEntity.ok(
                ApiResponse.<List<ProductResponse>>builder()
                        .success(true)
                        .message("Products retrieved successfully")
                        .data(products)
                        .build());
    }

    /**
     * Search products
     * GET /api/v1/products/search?q=searchTerm
     */
    @GetMapping("/search")
    @PreAuthorize("hasPermission('PRODUCT', 'READ')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> searchProducts(
            @RequestParam("q") String searchTerm) {

        log.info("Searching products with term: {}", searchTerm);

        List<ProductResponse> products = productService.searchProducts(searchTerm);

        return ResponseEntity.ok(
                ApiResponse.<List<ProductResponse>>builder()
                        .success(true)
                        .message("Search results retrieved successfully")
                        .data(products)
                        .build());
    }

    /**
     * Update product
     * PUT /api/v1/products/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUCT', 'EDIT')")
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
    @PreAuthorize("hasPermission('PRODUCT', 'DELETE')")
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
