/**
 * Why: Root Nest module needed as a realistic governed target.
 * How: Imports domain modules used in demo checks.
 * Example: Add `UsersModule` and `OrdersModule`.
 */
import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [UsersModule, OrdersModule],
})
export class AppModule {}
