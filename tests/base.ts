import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";
import { test as base } from "vitest";

const it = base.extend<{ nova: (args: string[]) => Promise<string> }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest
  nova: async ({}, use) => {
    const dir = await mkdtemp(path.join(tmpdir(), "nova-config-"));

    const nova = async (args: string[]) => {
      const result = await execa("nova", args, {
        env: {
          ...process.env,
          NOVA_CONFIG: dir,
        },
      });

      return result.stdout.trim();
    };

    try {
      await use(nova);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
});

export { it };
