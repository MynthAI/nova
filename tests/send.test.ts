import { describe, expect } from "vitest";
import { it } from "./base.js";

describe("nova send --dry-run", () => {
  it("prints dry run result with destination", async ({ nova }) => {
    const address = await nova(["address"]);
    const stdout = await nova(["send", "--dry-run", "10", address]);
    expect(stdout).toBe(`Would send 10 to ${address}`);
  });

  it("prints dry run result without destination", async ({ nova }) => {
    const stdout = await nova(["send", "--dry-run", "5"]);
    expect(stdout).toBe("Would send 5");
  });

  it("prints dry run result in JSON format", async ({ nova }) => {
    const address = await nova(["address"]);
    const stdout = await nova(["-j", "send", "--dry-run", "10", address]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.dryRun).toBe(true);
    expect(result.result.amount).toBe("10");
    expect(result.result.to).toBe(address);
  });

  it("prints dry run result in JSON format without destination", async ({
    nova,
  }) => {
    const stdout = await nova(["-j", "send", "--dry-run", "5"]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.dryRun).toBe(true);
    expect(result.result.amount).toBe("5");
    expect(result.result.to).toBeUndefined();
  });

  it("accepts short flag -d", async ({ nova }) => {
    const address = await nova(["address"]);
    const stdout = await nova(["send", "-d", "10", address]);
    expect(stdout).toBe(`Would send 10 to ${address}`);
  });
});
