/**
 * Why: Controller-level naming and docs should be validated too.
 * How: This minimal controller serves as second-case coverage.
 * Example: Future checks can ensure route method verb semantics.
 */
import { Controller } from "@nestjs/common";

@Controller("orders")
export class OrdersController {}
