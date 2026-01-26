import { password } from "@inquirer/prompts";
import { mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { type } from "arktype";
import { mayFailAsync } from "ts-handling";
import program, { logExit } from "../cli";
import config from "../config.js";

const PrivateKey = type("string.hex == 32").or("string.hex == 64");

const exportGroup = program
  .command("import")
  .description("Import an existing wallet");

exportGroup
  .command("key")
  .description("Import the wallet from private key")
  .action(async () => {
    const key = (
      await mayFailAsync(() =>
        password({
          message: "Enter the hex private key to import",
        }),
      )
    ).or("");

    if (!key) return logExit("no input received", 130);

    const validated = PrivateKey(key);

    if (validated instanceof type.errors) return logExit(validated.summary);

    config.set("privateKey", key.toLowerCase());
    console.log("Successfully imported wallet");
  });

exportGroup
  .command("phrase")
  .description("Import the wallet from mnemonic seed phrase")
  .action(async () => {
    const phrase = (
      await mayFailAsync(() =>
        password({
          message: "Enter the 12 or 24 word mnemonic seed phrase to import",
        }),
      )
    ).or("");

    if (!phrase) return logExit("no input received", 130);

    if (!validateMnemonic(phrase, wordlist))
      return logExit("must be valid mnemonic seed phrase");

    const entropy = mnemonicToEntropy(phrase, wordlist);
    const key = Buffer.from(entropy).toString("hex");

    if (key.length != 32 && key.length != 64)
      return logExit("phrase must be 12 or 24 words");

    config.set("privateKey", key);
    console.log("Successfully imported wallet");
  });
