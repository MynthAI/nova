import { input } from "@inquirer/prompts";
import { type } from "arktype";
import ky from "ky";
import { mayFailAsync } from "ts-handling";
import { generateKeys } from "./auth-signer";
import config from "./config";
import { AuthEndpoints, type Network } from "./endpoints";

const Code = type("string.alphanumeric == 6");

const login = async (email: string, network: Network) => {
  const keys = await generateKeys();

  const endpoint = AuthEndpoints[network];
  await ky.post(`${endpoint}/login`, {
    json: { email, publicKey: keys.public },
  });
  const code = (
    await mayFailAsync(() =>
      input({
        message: "Enter the authentication code sent to your email:",
        validate: (value) => {
          const code = Code(value.trim());
          if (code instanceof type.errors) return code.summary;
          return true;
        },
        transformer: (value) => value.trim().toUpperCase(),
      }),
    )
  ).or("");

  if (!code) {
    console.error("Code must be entered");
    process.exitCode = 1;
    return;
  }

  await ky.post(`${endpoint}/auth`, { json: { email, code } });

  const key = keys.private.export({ format: "pem", type: "pkcs8" });
  config.set(`${network}Email`, email);
  config.set(`${network}Key`, key);
};

export default login;
