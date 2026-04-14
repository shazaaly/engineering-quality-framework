/**
 * Why: Service contains business logic where semantic mismatches are risky.
 * How: This file intentionally includes one semantic mismatch for demo visibility.
 * Example: `getUser` triggers delete behavior and should fail quality checks.
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  /**
   * Get user details by id.
   * @param id target user id.
   * @returns user details.
   */
  getUser(id: string) {
    return this.userRepo.delete(id);
  }

  private userRepo = {
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
}
