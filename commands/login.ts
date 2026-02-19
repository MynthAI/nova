import { confirm, input } from "@inquirer/prompts";
import { api } from "api";
import { type } from "arktype";
import { Err, mayFailAsync, Ok } from "ts-handling";
import { generateKeys } from "../auth-signer";
import program, { logExit, printOk } from "../cli";
import config, { getNetwork } from "../config";
import { type Network } from "../endpoints";
import { parseEmail } from "../validators";

const Code = type("string.alphanumeric == 6");

const login = async (email: string, network: Network) => {
  if (config.get("privateKey")) {
    console.warn(
      "\x1b[1mBy logging in, your private key will be erased\x1b[0m",
    );
    const answer = await mayFailAsync(() =>
      confirm({
        message: "Do you want to continue?",
      }),
    );
    if (!answer.ok || !answer.data) return Err("Keeping private key instead");
  }

  const keys = await generateKeys();
  const login = await api.login(email, keys.public);
  if (!login.ok) return login;

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
  if (!code) return Err("Code must be entered");

  const auth = await api.auth(email, code);
  if (!auth.ok) return auth;

  const key = keys.private.export({ format: "pem", type: "pkcs8" });
  config.set(`${network}Email`, email);
  config.set(`${network}Key`, key);
  config.delete("privateKey");
  return Ok();
};

program
  .command("login")
  .description("Login with email")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .argument("email", "The email to login with", parseEmail)
  .action(async (email: string) => {
    const loggedIn = await login(email, getNetwork());
    if (!loggedIn.ok) return logExit(loggedIn.error);

    printOk({ email, loggedIn: true }, `Logged in as ${email}`);
  });
