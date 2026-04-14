/**
 * Why: Service file gives space for additional examples later.
 * How: Keep one compliant method to contrast with failing methods.
 * Example: `createOrder` follows clear intent naming.
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrdersService {
  /**
   * Create a lightweight order record.
   * @param id order id.
   * @returns order status.
   */
  createOrder(id: string) {
    return { id, status: "created" };
  }
}
