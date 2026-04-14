/**
 * Why: Service contains business logic where semantic mismatches are risky.
 * How: This file intentionally includes one ambiguous method for the demo.
 * Example: `processUser` actually deletes a user and should be renamed.
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  /**
   * Delete a user record by id.
   * @param id target user id.
   * @returns deletion status.
   */
  processUser(id: string) {
    return { id, deleted: true };
  }
}
