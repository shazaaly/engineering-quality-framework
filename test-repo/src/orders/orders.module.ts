/**
 * Why: Second domain proves rules apply consistently across modules.
 * How: Mirrors users domain with controller + service.
 * Example: Same naming and doc standards apply.
 */
import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
