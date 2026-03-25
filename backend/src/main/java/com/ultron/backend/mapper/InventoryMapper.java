package com.ultron.backend.mapper;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.dto.request.inventory.*;
import com.ultron.backend.dto.response.inventory.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Mapper for Inventory entities and DTOs
 */
@Component
public class InventoryMapper {

    // Warehouse mappings
    public Warehouse toWarehouseEntity(CreateWarehouseRequest request) {
        Warehouse warehouse = new Warehouse();
        warehouse.setCode(request.getCode());
        warehouse.setName(request.getName());
        warehouse.setType(request.getType());
        warehouse.setAddress(toAddressEntity(request.getAddress()));
        warehouse.setManagerId(request.getManagerId());
        warehouse.setManagerName(request.getManagerName());
        warehouse.setIsActive(request.getIsActive());
        warehouse.setIsDefault(request.getIsDefault());
        return warehouse;
    }

    public Warehouse toWarehouseEntity(UpdateWarehouseRequest request) {
        Warehouse warehouse = new Warehouse();
        warehouse.setName(request.getName());
        warehouse.setType(request.getType());
        if (request.getAddress() != null) {
            warehouse.setAddress(toAddressEntity(request.getAddress()));
        }
        warehouse.setManagerId(request.getManagerId());
        warehouse.setManagerName(request.getManagerName());
        warehouse.setIsActive(request.getIsActive());
        warehouse.setIsDefault(request.getIsDefault());
        return warehouse;
    }

    public WarehouseResponse toWarehouseResponse(Warehouse warehouse) {
        WarehouseResponse response = new WarehouseResponse();
        response.setId(warehouse.getId());
        response.setCode(warehouse.getCode());
        response.setName(warehouse.getName());
        response.setType(warehouse.getType());
        response.setAddress(toAddressDto(warehouse.getAddress()));
        response.setManagerId(warehouse.getManagerId());
        response.setManagerName(warehouse.getManagerName());
        response.setIsActive(warehouse.getIsActive());
        response.setIsDefault(warehouse.getIsDefault());
        if (warehouse.getLocations() != null) {
            response.setLocations(warehouse.getLocations().stream()
                .map(this::toStorageLocationDto)
                .collect(Collectors.toList()));
        }
        response.setCreatedAt(warehouse.getCreatedAt());
        response.setCreatedBy(warehouse.getCreatedBy());
        return response;
    }

    private Warehouse.Address toAddressEntity(CreateWarehouseRequest.AddressDto dto) {
        Warehouse.Address address = new Warehouse.Address();
        address.setLine1(dto.getLine1());
        address.setLine2(dto.getLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setCountry(dto.getCountry());
        address.setPostalCode(dto.getPostalCode());
        return address;
    }

    private WarehouseResponse.AddressDto toAddressDto(Warehouse.Address address) {
        if (address == null) return null;
        WarehouseResponse.AddressDto dto = new WarehouseResponse.AddressDto();
        dto.setLine1(address.getLine1());
        dto.setLine2(address.getLine2());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setCountry(address.getCountry());
        dto.setPostalCode(address.getPostalCode());
        return dto;
    }

    public Warehouse.StorageLocation toStorageLocationEntity(AddStorageLocationRequest request) {
        Warehouse.StorageLocation location = new Warehouse.StorageLocation();
        location.setCode(request.getCode());
        location.setName(request.getName());
        location.setType(request.getType());
        location.setCapacity(request.getCapacity());
        location.setIsActive(request.getIsActive());
        return location;
    }

    private WarehouseResponse.StorageLocationDto toStorageLocationDto(Warehouse.StorageLocation location) {
        WarehouseResponse.StorageLocationDto dto = new WarehouseResponse.StorageLocationDto();
        dto.setId(location.getId());
        dto.setCode(location.getCode());
        dto.setName(location.getName());
        dto.setType(location.getType());
        dto.setCapacity(location.getCapacity());
        dto.setIsActive(location.getIsActive());
        return dto;
    }

    // Stock mappings
    public StockResponse toStockResponse(Stock stock) {
        StockResponse response = new StockResponse();
        response.setId(stock.getId());
        response.setProductId(stock.getProductId());
        response.setWarehouseId(stock.getWarehouseId());
        response.setQuantityOnHand(stock.getQuantityOnHand());
        response.setQuantityReserved(stock.getQuantityReserved());
        response.setQuantityAvailable(stock.getQuantityAvailable());
        response.setReorderPoint(stock.getReorderPoint());
        response.setReorderQuantity(stock.getReorderQuantity());
        response.setCostingMethod(stock.getCostingMethod());
        response.setUnitCost(stock.getUnitCost());
        response.setTotalValue(stock.getTotalValue());
        response.setLastRestockedAt(stock.getLastRestockedAt());
        response.setCreatedAt(stock.getCreatedAt());
        return response;
    }

    // Stock Transaction mappings
    public StockTransactionResponse toStockTransactionResponse(StockTransaction transaction) {
        StockTransactionResponse response = new StockTransactionResponse();
        response.setId(transaction.getId());
        response.setTransactionId(transaction.getTransactionId());
        response.setTransactionType(transaction.getTransactionType().toString());
        response.setDirection(transaction.getDirection().toString());
        response.setProductId(transaction.getProductId());
        response.setWarehouseId(transaction.getWarehouseId());
        response.setQuantity(transaction.getQuantity());
        response.setQuantityBefore(transaction.getQuantityBefore());
        response.setQuantityAfter(transaction.getQuantityAfter());
        response.setUnitCost(transaction.getUnitCost());
        response.setTotalValue(transaction.getTotalValue());
        response.setReason(transaction.getReason());
        response.setReferenceType(transaction.getReferenceType());
        response.setReferenceId(transaction.getReferenceId());
        response.setTimestamp(transaction.getTimestamp());
        response.setRecordedBy(transaction.getRecordedBy());
        return response;
    }

    // Purchase Order mappings
    public PurchaseOrder toPurchaseOrderEntity(CreatePurchaseOrderRequest request) {
        PurchaseOrder po = new PurchaseOrder();
        po.setSupplierId(request.getSupplierId());
        po.setSupplierName(request.getSupplierName());
        po.setSupplierContact(request.getSupplierContact());
        po.setSupplierEmail(request.getSupplierEmail());
        po.setSupplierPhone(request.getSupplierPhone());
        po.setWarehouseId(request.getWarehouseId());
        po.setWarehouseName(request.getWarehouseName());
        po.setOrderDate(request.getOrderDate());
        po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        po.setShippingCost(request.getShippingCost());
        po.setPaymentTerms(request.getPaymentTerms());
        po.setNotes(request.getNotes());
        po.setTermsAndConditions(request.getTermsAndConditions());

        if (request.getItems() != null) {
            po.setItems(request.getItems().stream()
                .map(this::toLineItemEntity)
                .collect(Collectors.toList()));
        }

        return po;
    }

    private PurchaseOrder.LineItem toLineItemEntity(CreatePurchaseOrderRequest.LineItemRequest request) {
        PurchaseOrder.LineItem item = new PurchaseOrder.LineItem();
        item.setProductId(request.getProductId());
        item.setProductName(request.getProductName());
        item.setOrderedQuantity(request.getOrderedQuantity());
        item.setUnitPrice(request.getUnitPrice());
        item.setTaxRate(request.getTaxRate());
        item.setNotes(request.getNotes());
        return item;
    }

    public PurchaseOrderResponse toPurchaseOrderResponse(PurchaseOrder po) {
        PurchaseOrderResponse response = new PurchaseOrderResponse();
        response.setId(po.getId());
        response.setPoNumber(po.getPoNumber());
        response.setStatus(po.getStatus() != null ? po.getStatus().toString() : null);
        response.setSupplierId(po.getSupplierId());
        response.setSupplierName(po.getSupplierName());
        response.setSupplierContact(po.getSupplierContact());
        response.setSupplierEmail(po.getSupplierEmail());
        response.setSupplierPhone(po.getSupplierPhone());
        response.setWarehouseId(po.getWarehouseId());
        response.setWarehouseName(po.getWarehouseName());
        response.setOrderDate(po.getOrderDate());
        response.setExpectedDeliveryDate(po.getExpectedDeliveryDate());
        response.setReceivedDate(po.getReceivedDate());

        if (po.getItems() != null) {
            response.setItems(po.getItems().stream()
                .map(this::toLineItemResponse)
                .collect(Collectors.toList()));
        }

        response.setSubtotal(po.getSubtotal());
        response.setTaxAmount(po.getTaxAmount());
        response.setShippingCost(po.getShippingCost());
        response.setTotalAmount(po.getTotalAmount());
        response.setPaymentTerms(po.getPaymentTerms());
        response.setNotes(po.getNotes());
        response.setTermsAndConditions(po.getTermsAndConditions());
        response.setApprovedBy(po.getApprovedBy());
        response.setApprovedAt(po.getApprovedAt());
        response.setRejectedBy(po.getRejectedBy());
        response.setRejectedAt(po.getRejectedAt());
        response.setRejectionReason(po.getRejectionReason());
        response.setCreatedAt(po.getCreatedAt());
        response.setCreatedBy(po.getCreatedBy());
        return response;
    }

    private PurchaseOrderResponse.LineItemResponse toLineItemResponse(PurchaseOrder.LineItem item) {
        PurchaseOrderResponse.LineItemResponse response = new PurchaseOrderResponse.LineItemResponse();
        response.setLineItemId(item.getLineItemId());
        response.setProductId(item.getProductId());
        response.setProductName(item.getProductName());
        response.setOrderedQuantity(item.getOrderedQuantity());
        response.setReceivedQuantity(item.getReceivedQuantity());
        response.setRemainingQuantity(item.getRemainingQuantity());
        response.setUnitPrice(item.getUnitPrice());
        response.setTaxRate(item.getTaxRate());
        response.setTaxAmount(item.getTaxAmount());
        response.setTotalAmount(item.getTotalAmount());
        response.setNotes(item.getNotes());
        return response;
    }

    // Stock Reservation mappings
    public StockReservationResponse toStockReservationResponse(StockReservation reservation) {
        StockReservationResponse response = new StockReservationResponse();
        response.setId(reservation.getId());
        response.setProductId(reservation.getProductId());
        response.setWarehouseId(reservation.getWarehouseId());
        response.setQuantity(reservation.getQuantity());
        response.setReferenceType(reservation.getReferenceType());
        response.setReferenceId(reservation.getReferenceId());
        response.setReferenceNumber(reservation.getReferenceNumber());
        response.setStatus(reservation.getStatus() != null ? reservation.getStatus().toString() : null);
        response.setExpiresAt(reservation.getExpiresAt());
        response.setAutoReleaseEnabled(reservation.getAutoReleaseEnabled());
        response.setFulfilledAt(reservation.getFulfilledAt());
        response.setFulfilledBy(reservation.getFulfilledBy());
        response.setNotes(reservation.getNotes());
        response.setCreatedAt(reservation.getCreatedAt());
        response.setCreatedBy(reservation.getCreatedBy());
        return response;
    }

    // Batch mappings
    public Batch toBatchEntity(CreateBatchRequest request) {
        Batch batch = new Batch();
        batch.setProductId(request.getProductId());
        batch.setWarehouseId(request.getWarehouseId());
        batch.setBatchNumber(request.getBatchNumber());
        batch.setManufacturingDate(request.getManufacturingDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setQuantity(request.getQuantity());
        batch.setSupplierId(request.getSupplierId());
        batch.setSupplierName(request.getSupplierName());
        batch.setQcStatus(request.getQcStatus());
        batch.setQcDate(request.getQcDate());
        batch.setQcNotes(request.getQcNotes());
        return batch;
    }

    public BatchResponse toBatchResponse(Batch batch) {
        BatchResponse response = new BatchResponse();
        response.setId(batch.getId());
        response.setProductId(batch.getProductId());
        response.setWarehouseId(batch.getWarehouseId());
        response.setBatchNumber(batch.getBatchNumber());
        response.setManufacturingDate(batch.getManufacturingDate());
        response.setExpiryDate(batch.getExpiryDate());
        response.setShelfLifeDays(batch.getShelfLifeDays());
        response.setQuantity(batch.getQuantity());
        response.setQuantityReserved(batch.getQuantityReserved());
        response.setQuantityAvailable(batch.getQuantityAvailable());
        response.setOriginalQuantity(batch.getOriginalQuantity());
        response.setStatus(batch.getStatus() != null ? batch.getStatus().toString() : null);
        response.setSupplierId(batch.getSupplierId());
        response.setSupplierName(batch.getSupplierName());
        response.setQcStatus(batch.getQcStatus());
        response.setQcDate(batch.getQcDate());
        response.setQcBy(batch.getQcBy());
        response.setQcNotes(batch.getQcNotes());
        response.setIsRecalled(batch.getIsRecalled());
        response.setRecallDate(batch.getRecallDate());
        response.setRecallReason(batch.getRecallReason());
        response.setRecallBy(batch.getRecallBy());
        response.setCreatedAt(batch.getCreatedAt());
        response.setCreatedBy(batch.getCreatedBy());
        return response;
    }
}
