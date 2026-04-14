/**
 * Why: Service file gives space for additional examples later.
 * How: Keep one compliant method to contrast with failing methods.
 * Example: `createOrder` follows clear intent naming.
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrdersService {
  private readonly orderRepo = {
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
}
