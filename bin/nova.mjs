#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const cliTs = path.join(projectRoot, "cli.ts");

const localTsx = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);
const tsxCmd = existsSync(localTsx) ? localTsx : "tsx";

const result = spawnSync(tsxCmd, [cliTs, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: projectRoot,
  shell: false,
});

process.exit(result.status ?? 1);
