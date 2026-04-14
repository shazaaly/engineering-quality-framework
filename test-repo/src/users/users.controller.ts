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

  /**
   * Fetch user by id (HTTP handler).
   * @param id User id from route.
   * @returns User payload from service.
   */
  @Get(":id")
  getUser(@Param("id") id: string) {
    return this.usersService.getUser(id);
  }
}
