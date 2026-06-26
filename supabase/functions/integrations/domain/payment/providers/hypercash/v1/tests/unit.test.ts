import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";
import { Validator } from "../validator.ts";
import { Mapper } from "../mapper.ts";

Deno.test("Validator - validateCredentials", () => {
  const result = Validator.validateCredentials({ apiKey: "" });
  assertEquals(result.isValid, false);
});

Deno.test("Mapper - toPaymentStatus", () => {
  const status = Mapper.toPaymentStatus("PAID");
  assertEquals(status, "approved");
});
