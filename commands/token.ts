import { createPrivateKey, randomBytes } from "crypto";
import { Err, Ok } from "ts-handling";
import { api } from "../api.js";
import { signPayload } from "../auth-signer.js";
import program, { logExit, printOk } from "../cli.js";
import config, { getNetwork } from "../config.js";
import { type Network } from "../endpoints.js";

const createToken = async (network: Network) => {
  const email = config.get(`${network}Email`);
  const key = config.get(`${network}Key`);

  if (!email) return Err("Email not set. Run `nova login <email>` first");

  if (!key) return Err("Key not set. Login via `nova login <email>` first");

  const nonce = randomBytes(32);
  const signature = signPayload(nonce, createPrivateKey(key));
  const response = await api.createToken(
    email,
    nonce.toString("hex"),
    signature,
  );
  if (!response.ok) return response;
  return Ok(response.data.contents.token);
};

program
  .command("token")
  .description("Creates an authentication token after login")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .action(async () => {
    const token = await createToken(getNetwork());
    if (!token.ok) return logExit(token.error);

    printOk({ authenticated: true, token: token.data }, token.data);
  });

export { createToken };
