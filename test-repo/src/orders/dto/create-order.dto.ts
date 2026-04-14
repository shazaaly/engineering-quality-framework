/**
 * Why: DTO files are part of enforceable Nest naming conventions.
 * How: Keep DTO naming explicit to reduce onboarding confusion.
 * Example: `CreateOrderDto` is valid; `OrderPayload` is not.
 */
export class CreateOrderDto {
  productId!: string;
}
