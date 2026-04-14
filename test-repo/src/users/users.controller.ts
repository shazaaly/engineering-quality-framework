/**
 * Why: Controller exposes API boundary for demo checks.
 * How: Calls service methods that are intentionally mixed quality.
 * Example: `getUser` demonstrates semantic mismatch detection.
 */
import { Controller, Get, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  getUser(@Param("id") id: string) {
    return this.usersService.getUser(id);
  }
}
