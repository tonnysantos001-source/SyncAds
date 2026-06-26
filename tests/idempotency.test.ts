import { describe, it, expect, vi } from "vitest";
import { Idempotency } from "../supabase/functions/integrations/infrastructure/Idempotency";

describe("Idempotency Manager Tests", () => {
  it("should allow first request to start processing", async () => {
    // Mock Supabase client chaining: from().insert().select().maybeSingle()
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "idemp_1", status: "processing" },
      error: null,
    });
    
    const mockSelect = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    const mockInsert = vi.fn().mockReturnValue({
      select: mockSelect,
    });
    
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as any;

    const idempotency = new Idempotency(mockSupabase);
    const result = await idempotency.start("user_1", "idem_key_1", { amount: 100 });

    expect(result.isDuplicate).toBe(false);
    expect(result.status).toBe("processing");
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("should detect duplicate request if already processing", async () => {
    // Mock Supabase client throwing unique key violation on insert
    const mockMaybeSingleInsert = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "duplicate key value violates unique constraint" },
    });
    
    const mockSelectInsert = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingleInsert,
    });

    const mockInsert = vi.fn().mockReturnValue({
      select: mockSelectInsert,
    });
    
    // Mock Supabase client returning existing record on select
    const mockSingleSelect = vi.fn().mockResolvedValue({
      data: { id: "idemp_1", status: "processing" },
      error: null,
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingleSelect,
            }),
          }),
        }),
      }),
    } as any;

    const idempotency = new Idempotency(mockSupabase);
    const result = await idempotency.start("user_1", "idem_key_1", { amount: 100 });

    expect(result.isDuplicate).toBe(true);
    expect(result.status).toBe("processing");
  });

  it("should return completed response payload if already completed", async () => {
    const mockMaybeSingleInsert = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "duplicate key" },
    });
    
    const mockSelectInsert = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingleInsert,
    });

    const mockInsert = vi.fn().mockReturnValue({
      select: mockSelectInsert,
    });
    
    const mockSingleSelect = vi.fn().mockResolvedValue({
      data: { id: "idemp_1", status: "completed", response_payload: { success: true, transactionId: "tx_123" } },
      error: null,
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingleSelect,
            }),
          }),
        }),
      }),
    } as any;

    const idempotency = new Idempotency(mockSupabase);
    const result = await idempotency.start("user_1", "idem_key_1", { amount: 100 });

    expect(result.isDuplicate).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.responsePayload).toEqual({ success: true, transactionId: "tx_123" });
  });
});
