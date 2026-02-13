import { entropyToMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { type } from "arktype";
import { Err, Ok } from "ts-handling";
import program, { logExit } from "../cli";
import { getPrivateKey as getSavedPrivateKey } from "../config";

const PrivateKey = type("string.hex == 32").or("string.hex == 64");

const getPrivateKey = () => {
  const key = getSavedPrivateKey();
  if (!key) return Err("Private key isn't set");

  const validatedKey = PrivateKey(key);
  if (validatedKey instanceof type.errors) return Err(validatedKey.summary);

  return Ok(validatedKey);
};

const exportGroup = program
  .command("export")
  .description("export sensitive wallet data");

exportGroup
  .command("key")
  .description("export the wallet's private key")
  .action(() => {
    const key = getPrivateKey();
    if (!key.ok) return logExit(key.error);

    console.log(key.data);
  });

exportGroup
  .command("phrase")
  .description("export the wallet's mnemonic seed phrase")
  .action(() => {
    const key = getPrivateKey();
    if (!key.ok) return logExit(key.error);

    console.log(entropyToMnemonic(Buffer.from(key.data, "hex"), wordlist));
  });
