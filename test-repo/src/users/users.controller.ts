/**
 * Why: Controller exposes API boundary for demo checks.
 * How: Calls service methods that are intentionally mixed quality.
 * Example: `getUser` demonstrates semantic mismatch detection.
 */
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
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

  /**
   * Create a user record from request payload.
   * @param input user creation payload.
   * @returns created user profile.
   */
  @Post()
  createUser(@Body() input: CreateUserDto) {
    return this.usersService.createUserProfile(input);
  }

  /**
   * Fetch all active users for admin dashboard.
   * @returns list of active users.
   */
  @Get()
  getActiveUsers() {
    return this.usersService.getActiveUsers();
  }
}
