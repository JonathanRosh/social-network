import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAuth } from "../src/middleware/requireAuth.js";

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("requireAuth", () => {
  it("rejects requests with no session userId", () => {
    const req = { session: {} } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when a session userId is present", () => {
    const req = { session: { userId: "user-123" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
