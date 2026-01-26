import { confirm, input } from "@inquirer/prompts";
import { type } from "arktype";
import ky from "ky";
import { Err, mayFailAsync, Ok } from "ts-handling";
import { generateKeys } from "../auth-signer";
import program, { logExit } from "../cli";
import config, { getNetwork } from "../config";
import { AuthEndpoints, type Network } from "../endpoints";
import { RateLimited } from "../responses";
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
  const endpoint = AuthEndpoints[network];
  const response = await ky.post(`${endpoint}/login`, {
    json: { email, publicKey: keys.public },
    throwHttpErrors: false,
  });

  if (response.status == 429) {
    const json = await response.json();
    const rateLimited = RateLimited(json);

    if (rateLimited instanceof type.errors)
      return Err("Rate limited; try again later");

    const seconds = rateLimited.contents.retryAfterSeconds;
    return Err(`Rate limited. Try again in ${seconds} seconds`);
  }

  if (response.status > 299) {
    const json = await response.json();
    return Err(JSON.stringify(json, undefined, 2));
  }

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

  await ky.post(`${endpoint}/auth`, { json: { email, code } });

  const key = keys.private.export({ format: "pem", type: "pkcs8" });
  config.set(`${network}Email`, email);
  config.set(`${network}Key`, key);
  config.delete("privateKey");
  return Ok();
};

program
  .command("login")
  .description("Login with email")
  .argument("email", "The email to login with", parseEmail)
  .action(async (email: string) => {
    const loggedIn = await login(email, getNetwork());
    if (!loggedIn.ok) return logExit(loggedIn.error);

    console.log("Logged in as", email);
  });
