/**
 * Why: Controller-level naming and docs should be validated too.
 * How: This minimal controller serves as second-case coverage.
 * Example: Future checks can ensure route method verb semantics.
 */
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create an order from request payload.
   * @param input order creation payload.
   * @returns created order with computed totals.
   */
  @Post()
  createOrder(@Body() input: CreateOrderDto) {
    return this.ordersService.createOrderFromInput(input);
  }

  /**
   * Fetch pricing summary for an order.
   * @param id order id from route.
   * @returns order pricing breakdown.
   */
  @Get(":id/summary")
  getOrderPricingSummary(@Param("id") id: string) {
    return this.ordersService.getOrderPricingSummary(id);
  }
}
