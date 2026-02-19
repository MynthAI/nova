import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { password } from "@inquirer/prompts";
import { mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { type } from "arktype";
import { mayFailAsync } from "ts-handling";
import program, { logExit, printOk } from "../cli.js";
import config from "../config.js";

const PrivateKey = type("string.hex == 32").or("string.hex == 64");

const exportGroup = program
  .command("import")
  .description("Import an existing wallet");

const exists = async (p: string) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const resolveInputFile = async (filePath: string) => {
  // absolute path: use as-is
  if (path.isAbsolute(filePath)) return filePath;

  // relative: try INIT_CWD first, then cwd
  const initCwd = process.env.INIT_CWD;
  const fromInit = initCwd ? path.resolve(initCwd, filePath) : null;
  if (fromInit && (await exists(fromInit))) return fromInit;

  const fromCwd = path.resolve(process.cwd(), filePath);
  if (await exists(fromCwd)) return fromCwd;

  // if neither exists, default to INIT_CWD resolution if present, else cwd
  return fromInit ?? fromCwd;
};

const readValueFromFile = async (filePath: string) => {
  const resolved = await resolveInputFile(filePath);

  try {
    const raw = await readFile(resolved, "utf8");
    return raw.trim();
  } catch {
    return "";
  }
};

const ensureNotBoth = (direct?: string, file?: string) => {
  if (direct && file) {
    logExit("provide either a CLI value or --file, not both");
    return false;
  }

  return true;
};

exportGroup
  .command("key")
  .description("Import the wallet from private key")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .option("-k, --key <hex>", "Hex private key to import (32 or 64 hex chars)")
  .option("-f, --file <path>", "Read the hex private key from a file")
  .action(async (opts: { key?: string; file?: string }) => {
    if (!ensureNotBoth(opts.key, opts.file)) return;

    const key = (
      opts.key ??
      (opts.file ? await readValueFromFile(opts.file) : undefined) ??
      (
        await mayFailAsync(() =>
          password({
            message: "Enter the hex private key to import",
          }),
        )
      ).or("")
    ).trim();

    if (!key) return logExit("no input received");

    const validated = PrivateKey(key);
    if (validated instanceof type.errors) return logExit(validated.summary);

    config.set("privateKey", key.toLowerCase());
    printOk({ imported: true, method: "key" }, "Successfully imported wallet");
  });

exportGroup
  .command("phrase")
  .description("Import the wallet from mnemonic seed phrase")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .option("-p, --phrase <mnemonic>", "Mnemonic seed phrase (12 or 24 words)")
  .option("-f, --file <path>", "Read the mnemonic seed phrase from a file")
  .action(async (opts: { phrase?: string; file?: string }) => {
    if (!ensureNotBoth(opts.phrase, opts.file)) return;

    const phrase = (
      opts.phrase ??
      (opts.file ? await readValueFromFile(opts.file) : undefined) ??
      (
        await mayFailAsync(() =>
          password({
            message: "Enter the 12 or 24 word mnemonic seed phrase to import",
          }),
        )
      ).or("")
    ).trim();

    if (!phrase) return logExit("no input received");

    if (!validateMnemonic(phrase, wordlist))
      return logExit("must be valid mnemonic seed phrase");

    const entropy = mnemonicToEntropy(phrase, wordlist);
    const key = Buffer.from(entropy).toString("hex");

    if (key.length != 32 && key.length != 64)
      return logExit("phrase must be 12 or 24 words");

    config.set("privateKey", key);
    printOk(
      { imported: true, method: "phrase" },
      "Successfully imported wallet",
    );
  });
