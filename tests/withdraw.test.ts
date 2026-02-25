import { describe, expect } from "vitest";
import { it } from "./base.js";

const SOLANA_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("nova withdraw --dry-run", () => {
  it("prints dry run result", async ({ nova }) => {
    const stdout = await nova([
      "withdraw",
      "--dry-run",
      "10",
      "USDC",
      SOLANA_ADDRESS,
      "solana",
    ]);
    expect(stdout).toBe(`Would withdraw 10 to ${SOLANA_ADDRESS}`);
  });

  it("prints dry run result in JSON format", async ({ nova }) => {
    const stdout = await nova([
      "-j",
      "withdraw",
      "--dry-run",
      "10",
      "USDC",
      SOLANA_ADDRESS,
      "solana",
    ]);
    const result = JSON.parse(stdout);
    expect(result.status).toBe("ok");
    expect(result.result.dryRun).toBe(true);
    expect(result.result.amount).toBe("10");
    expect(result.result.stablecoin).toBe("USDC");
    expect(result.result.blockchain).toBe("solana");
    expect(result.result.to).toBe(SOLANA_ADDRESS);
  });

  it("errors when stablecoin does not exist for blockchain", async ({
    nova,
  }) => {
    await expect(
      nova([
        "-j",
        "withdraw",
        "--dry-run",
        "10",
        "USDA",
        SOLANA_ADDRESS,
        "solana",
      ]),
    ).rejects.toThrow();
  });

  it("accepts short flag -d", async ({ nova }) => {
    const stdout = await nova([
      "withdraw",
      "-d",
      "10",
      "USDC",
      SOLANA_ADDRESS,
      "solana",
    ]);
    expect(stdout).toBe(`Would withdraw 10 to ${SOLANA_ADDRESS}`);
  });
});
