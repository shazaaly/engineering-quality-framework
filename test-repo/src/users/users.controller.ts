/**
 * Why: Controller exposes API boundary for demo checks.
 * How: Calls service methods that are intentionally mixed quality.
 * Example: `processUser` demonstrates semantic mismatch detection.
 */
import { Controller, Delete, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(":id")
  processUser(@Param("id") id: string) {
    return this.usersService.processUser(id);
  }
}
