import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials) {
      return { isValid: false, errors: ["Credentials missing"] };
    }
    if (!credentials.apiKey) errors.push("apiKey is required");
    if (!credentials.token) errors.push("token is required");
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId) errors.push("orderId is required");
    if (!request.amount || request.amount <= 0) errors.push("amount must be greater than 0");
    if (!request.paymentMethod) errors.push("paymentMethod is required");
    if (!request.customer?.name) errors.push("customer name is required");
    if (!request.customer?.document) errors.push("customer document is required");
    return { isValid: errors.length === 0, errors };
  }
}
