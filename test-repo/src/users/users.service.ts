/**
 * Why: Service contains business logic where semantic mismatches are risky.
 * How: This file keeps clear intent naming with one read and one destructive method.
 * Example: `getUser` reads user data, `deleteUser` performs delete behavior.
 */
import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  /**
   * Get user details by id.
   * @param id target user id.
   * @returns user details.
   */
  getUser(id: string) {
    return this.userRepo.find(id);
  }

  /**
   * Delete user details by id.
   * @param id target user id.
   * @returns deletion status.
   */
  deleteUser(id: string) {
    return this.userRepo.delete(id);
  }

  private userRepo = {
    create(input: CreateUserDto) {
      return { id: "user-created", ...input, active: true };
    },
    listActive() {
      return [
        { id: "user-1", email: "a@example.com", active: true },
        { id: "user-2", email: "b@example.com", active: true },
      ];
    },
    delete(targetId: string) {
      return { id: targetId, deleted: true };
    },
    find(targetId: string) {
      return { id: targetId, email: "demo@example.com" };
    },
  };

  /**
   * Correct example for demo contrast.
   * @param id target user id.
   * @returns user details.
   */
  findUser(id: string) {
    return this.userRepo.find(id);
  }

  /**
   * Create user profile from request payload.
   * @param input user creation payload.
   * @returns created user profile.
   */
  createUserProfile(input: CreateUserDto) {
    return this.userRepo.create(input);
  }

  /**
   * List active users for dashboard summary.
   * @returns array of active users.
   */
  getActiveUsers() {
    return this.userRepo.listActive();
  }

  /**
   * Validate if provided email format is acceptable.
   * @param email user email input.
   * @returns true when email is valid.
   */
  validateUserEmail(email: string) {
    return email.includes("@") && email.includes(".");
  }

}
