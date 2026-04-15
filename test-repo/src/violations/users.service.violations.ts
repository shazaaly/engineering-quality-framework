/**
 * Intentionally bad examples for lint demo.
 * Excluded from Compodoc so generated API docs stay clean.
 */
import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersServiceViolations {
  private readonly userRepo = {
    delete(targetId: string) {
      return { id: targetId, deleted: true };
    },
    find(targetId: string) {
      return { id: targetId, email: "demo@example.com" };
    },
  };

  // Intentionally bad demo case: weak verb + missing TSDoc.
  // process() {
  //   return this.userRepo.find("demo-user-id");
  // }

  // // Intentionally bad demo case: read-intent name with destructive behavior.
  // getAccountAndDelete(id: string) {
  //   return this.userRepo.delete(id);
  // }

  // // Intentionally bad demo case: create-intent name without create operation.
  // createUserRecord(id: string) {
  //   return this.userRepo.find(id);
  // }

  // // Intentionally bad demo case: validate-intent name but returns non-boolean value.
  // validateUserPayload(payload: string) {
  //   return payload;
  // }

  // // Intentionally bad demo case: generic parameter/variable names.
  // setTempData(data: string) {
  //   const result = data.trim();
  //   return result;
  // }
}
