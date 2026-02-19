import { describe, expect } from "vitest";
import { it } from "./base";

describe("nova balance (integration)", () => {
  it("prints 0 for a fresh config", async ({ nova }) => {
    const stdout = await nova(["balance"]);
    expect(stdout).toBe("0");
  });

  it("prints 0 for a fresh config in JSON format", async ({ nova }) => {
    const stdout = await nova(["-j", "balance"]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.balance).toBe("0");
  });
});
