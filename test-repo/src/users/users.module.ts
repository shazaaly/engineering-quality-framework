/**
 * Why: Domain modules model bounded context in NestJS.
 * How: Registers controller and service for user domain.
 * Example: `UsersController` + `UsersService`.
 */
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
