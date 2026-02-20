package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.DiscountType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Service for calculating proposal totals with discounts and taxes.
 *
 * Calculation Flow:
 * 1. Calculate each line item:
 *    - Line subtotal = quantity × unit price
 *    - Apply line-item discount (percentage or fixed)
 *    - Calculate tax on discounted amount
 *    - Line total = subtotal - line discount + tax
 *
 * 2. Calculate proposal totals:
 *    - Subtotal = sum of all line subtotals
 *    - Total line discounts = sum of all line discount amounts
 *    - Apply overall discount on (subtotal - line discounts)
 *    - Total tax = sum of all line tax amounts
 *    - Grand total = subtotal - line discounts - overall discount + tax
 */
@Service
@Slf4j
public class ProposalCalculationService {

    /**
     * Calculate all totals for a proposal.
     * Handles both line-item discounts and overall discounts.
     */
    public Proposal calculateTotals(Proposal proposal) {
        if (proposal.getLineItems() == null || proposal.getLineItems().isEmpty()) {
            proposal.setSubtotal(BigDecimal.ZERO);
            proposal.setDiscountAmount(BigDecimal.ZERO);
            proposal.setTaxAmount(BigDecimal.ZERO);
            proposal.setTotalAmount(BigDecimal.ZERO);
            return proposal;
        }

        // Step 1: Calculate each line item
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalLineDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (Proposal.ProposalLineItem item : proposal.getLineItems()) {
            calculateLineItem(item, proposal.getGstType());
            subtotal = subtotal.add(item.getLineSubtotal());
            totalLineDiscount = totalLineDiscount.add(item.getLineDiscountAmount());
            totalTax = totalTax.add(item.getLineTaxAmount());
        }

        proposal.setSubtotal(subtotal);

        // Step 2: Apply overall discount
        BigDecimal amountAfterLineDiscounts = subtotal.subtract(totalLineDiscount);
        BigDecimal overallDiscount = calculateOverallDiscount(
            amountAfterLineDiscounts,
            proposal.getDiscount()
        );

        // Step 3: Calculate total discount (line-item + overall)
        BigDecimal totalDiscount = totalLineDiscount.add(overallDiscount);
        proposal.setDiscountAmount(totalDiscount);

        // Step 4: Tax is already calculated per line item
        proposal.setTaxAmount(totalTax);

        // Step 5: Calculate final total
        // Formula: Subtotal - Line Discounts + Tax - Overall Discount
        BigDecimal total = subtotal
            .subtract(totalLineDiscount)
            .add(totalTax)
            .subtract(overallDiscount);

        proposal.setTotalAmount(total);

        log.debug("Proposal calculation: subtotal={}, lineDiscount={}, overallDiscount={}, tax={}, total={}",
                 subtotal, totalLineDiscount, overallDiscount, totalTax, total);

        return proposal;
    }

    /**
     * Calculate totals for a single line item.
     *
     * Formula:
     * 1. Line subtotal = quantity × unit price
     * 2. Line discount = based on discount type (percentage or fixed)
     * 3. Tax = (subtotal - line discount) × tax rate
     * 4. Line total = subtotal - line discount + tax
     */
    private void calculateLineItem(Proposal.ProposalLineItem item, com.ultron.backend.domain.enums.GstType gstType) {
        // Line subtotal = quantity * unitPrice
        BigDecimal lineSubtotal = item.getUnitPrice()
            .multiply(BigDecimal.valueOf(item.getQuantity()))
            .setScale(2, RoundingMode.HALF_UP);
        item.setLineSubtotal(lineSubtotal);

        // Calculate line-item discount
        BigDecimal lineDiscount = BigDecimal.ZERO;
        if (item.getDiscountType() != null && item.getDiscountValue() != null) {
            if (item.getDiscountType() == DiscountType.PERCENTAGE) {
                // Validate percentage is not > 100%
                if (item.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                    throw new IllegalArgumentException(
                        String.format("Line item discount percentage cannot exceed 100%% (got %.2f%%)",
                            item.getDiscountValue())
                    );
                }
                // Percentage discount
                lineDiscount = lineSubtotal
                    .multiply(item.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                // Fixed amount discount - cannot exceed line subtotal
                if (item.getDiscountValue().compareTo(lineSubtotal) > 0) {
                    throw new IllegalArgumentException(
                        String.format("Line item discount amount (%.2f) cannot exceed line subtotal (%.2f)",
                            item.getDiscountValue(), lineSubtotal)
                    );
                }
                lineDiscount = item.getDiscountValue();
            }
        }
        item.setLineDiscountAmount(lineDiscount);

        // Amount after discount
        BigDecimal amountAfterDiscount = lineSubtotal.subtract(lineDiscount);

        // Override tax rate if GST is enabled
        BigDecimal appliedTaxRate = item.getTaxRate() != null ? item.getTaxRate() : BigDecimal.ZERO;
        if (gstType != null && (gstType == com.ultron.backend.domain.enums.GstType.IGST || gstType == com.ultron.backend.domain.enums.GstType.CGST_SGST)) {
            appliedTaxRate = BigDecimal.valueOf(18.0);
            item.setTaxRate(appliedTaxRate);
        }

        // Calculate tax on discounted amount
        BigDecimal lineTax = amountAfterDiscount
            .multiply(appliedTaxRate)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        item.setLineTaxAmount(lineTax);

        // Line total = subtotal - discount + tax
        BigDecimal lineTotal = amountAfterDiscount.add(lineTax);
        item.setLineTotal(lineTotal);
    }

    /**
     * Calculate overall discount on the proposal.
     *
     * Overall discount is applied AFTER line-item discounts.
     * This prevents double-discounting.
     */
    private BigDecimal calculateOverallDiscount(BigDecimal amountAfterLineDiscounts,
                                                 Proposal.DiscountConfig discount) {
        if (discount == null || discount.getOverallDiscountType() == null) {
            return BigDecimal.ZERO;
        }

        if (discount.getOverallDiscountType() == DiscountType.PERCENTAGE) {
            // Validate percentage is not > 100%
            if (discount.getOverallDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException(
                    String.format("Overall discount percentage cannot exceed 100%% (got %.2f%%)",
                        discount.getOverallDiscountValue())
                );
            }
            // Percentage discount
            return amountAfterLineDiscounts
                .multiply(discount.getOverallDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            // Fixed amount discount - cannot exceed amount after line discounts
            if (discount.getOverallDiscountValue().compareTo(amountAfterLineDiscounts) > 0) {
                throw new IllegalArgumentException(
                    String.format("Overall discount amount (%.2f) cannot exceed subtotal after line discounts (%.2f)",
                        discount.getOverallDiscountValue(), amountAfterLineDiscounts)
                );
            }
            return discount.getOverallDiscountValue();
        }
    }
}
