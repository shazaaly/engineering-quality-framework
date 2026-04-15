/**
 * Why: Service file gives space for additional examples later.
 * How: Keep one compliant method to contrast with failing methods.
 * Example: `createOrder` follows clear intent naming.
 */
import { Injectable } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  private readonly orderRepo = {
    find(orderId: string) {
      return { id: orderId, productId: "sku-101", quantity: 2, unitPrice: 25 };
    },
    create(orderId: string) {
      return { id: orderId, status: "created" };
    },
  };

  /**
   * Create a lightweight order record.
   * @param id order id.
   * @returns order status.
   */
  createOrder(id: string) {
    return this.orderRepo.create(id);
  }

  /**
   * Create order from structured payload.
   * @param input order creation payload.
   * @returns created order with totals.
   */
  createOrderFromInput(input: CreateOrderDto) {
    const subtotalAmount = input.quantity * input.unitPrice;
    const serviceFeeAmount = subtotalAmount * 0.05;
    const totalAmount = subtotalAmount + serviceFeeAmount;
    return {
      ...this.orderRepo.create(`order-${input.productId}`),
      ...input,
      subtotalAmount,
      serviceFeeAmount,
      totalAmount,
    };
  }

  /**
   * Fetch pricing summary for a specific order.
   * @param orderId target order id.
   * @returns pricing details and totals.
   */
  getOrderPricingSummary(orderId: string) {
    const orderDetails = this.orderRepo.find(orderId);
    const subtotalAmount = orderDetails.quantity * orderDetails.unitPrice;
    const taxAmount = subtotalAmount * 0.14;
    return {
      ...orderDetails,
      subtotalAmount,
      taxAmount,
      grandTotalAmount: subtotalAmount + taxAmount,
    };
  }

  /**
   * Validate order amount constraints.
   * @param unitPrice per-item price.
   * @returns true when unit price is in acceptable range.
   */
  validateOrderAmount(unitPrice: number) {
    return unitPrice > 0 && unitPrice < 10000;
  }
}
