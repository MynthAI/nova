import { createPrivateKey, randomBytes } from "crypto";
import ky from "ky";
import { Err, Ok } from "ts-handling";
import { signPayload } from "../auth-signer";
import program, { logExit, printOk } from "../cli";
import config, { getNetwork } from "../config";
import { AuthEndpoints, type Network } from "../endpoints";
import { TokenCreatedResponse } from "../responses";

const createToken = async (network: Network) => {
  const email = config.get(`${network}Email`);
  const key = config.get(`${network}Key`);

  if (!email) return Err("Email not set. Run `nova login <email>` first");

  if (!key) return Err("Key not set. Login via `nova login <email>` first");

  const endpoint = AuthEndpoints[network];
  const nonce = randomBytes(32);
  const signature = signPayload(nonce, createPrivateKey(key));
  const response = await ky
    .post(`${endpoint}/create-token`, {
      json: { email, nonce: nonce.toString("hex"), signature },
    })
    .json();
  const validatedResponse = TokenCreatedResponse.assert(response);
  const token = validatedResponse.contents.token;
  return Ok(token);
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
