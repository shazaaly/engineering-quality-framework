/**
 * Why: Service contains business logic where semantic mismatches are risky.
 * How: This file keeps clear intent naming with one read and one destructive method.
 * Example: `getUser` reads user data, `deleteUser` performs delete behavior.
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

  // Intentionally bad demo case: weak verb + missing TSDoc.
  process() {
    return this.userRepo.find("demo-user-id");
  }

  // Intentionally bad demo case: read-intent name with destructive behavior.
  getAccountAndDelete(id: string) {
    return this.userRepo.delete(id);
  }

  // Intentionally bad demo case: create-intent name without create operation.
  createUserRecord(id: string) {
    return this.userRepo.find(id);
  }

  // Intentionally bad demo case: validate-intent name but returns non-boolean value.
  validateUserPayload(payload: string) {
    return payload;
  }

  // Intentionally bad demo case: generic parameter/variable names.
  setTempData(data: string) {
    const result = data.trim();
    return result;
  }
}
