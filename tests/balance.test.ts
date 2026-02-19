import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("nova balance (integration)", () => {
  let tempConfigDir: string;

  beforeEach(async () => {
    tempConfigDir = await mkdtemp(path.join(tmpdir(), "nova-config-"));
  });

  afterEach(async () => {
    if (tempConfigDir)
      await rm(tempConfigDir, { recursive: true, force: true });
  });

  it("prints 0 for a fresh config", async () => {
    const result = await execa("nova", ["balance"], {
      env: {
        ...process.env,
        NOVA_CONFIG: tempConfigDir,
      },
    });

    expect(result.stdout.trim()).toBe("0");
  });
});
