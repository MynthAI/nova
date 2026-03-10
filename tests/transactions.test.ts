import { describe, expect } from "vitest";
import { it } from "./base.js";

describe("nova transactions", () => {
  it("prints no transactions for a fresh account", async ({ nova }) => {
    const stdout = await nova(["transactions"]);
    expect(stdout).toBe("No transactions");
  });

  it("prints no transactions for a fresh account in JSON format", async ({
    nova,
  }) => {
    const stdout = await nova(["-j", "transactions"]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.transactions).toEqual([]);
  });

  it("prints no transactions for a given address", async ({ nova }) => {
    const address = await nova(["address"]);
    const stdout = await nova(["transactions", address]);
    expect(stdout).toBe("No transactions");
  });

  it("prints no transactions for a given address in JSON format", async ({
    nova,
  }) => {
    const address = await nova(["address"]);
    const stdout = await nova(["-j", "transactions", address]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.transactions).toEqual([]);
  });
});
