import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashToken } from "../lib/auth/tokens";
import { hashPassword, verifyPassword } from "../lib/auth/passwords";

describe("auth primitives", () => {
  it("verifies bcrypt password hashes", async () => {
    const hash = await hashPassword("correct-password");

    await expect(verifyPassword("correct-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("creates opaque tokens and hashes them deterministically", () => {
    const token = createOpaqueToken();

    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("def"));
  });
});
