/**
 * Why: DTO naming is a core Nest convention enforced by the toolkit.
 * How: Use `{Action}{Resource}Dto` pattern for all payload contracts.
 * Example: `CreateUserDto`.
 */
export class CreateUserDto {
  fullName!: string;
  email!: string;
  role!: "admin" | "member";
}
