import { type } from "arktype";
import { Err, Ok } from "ts-handling";
import { api } from "../api.js";
import { generateKeys } from "../auth-signer.js";
import program, { logExit, printOk } from "../cli.js";
import config, { getNetwork } from "../config.js";
import { type Network } from "../endpoints.js";
import { parseEmail } from "../validators.js";

const Code = type("string")
  .pipe((v) => v.trim().toUpperCase())
  .pipe(type("string.alphanumeric == 6"));

const pendingEmailKey = (network: Network) => `${network}PendingEmail` as const;
const pendingPrivKey = (network: Network) => `${network}PendingKey` as const;

/**
 * Step 1: Request a login code (non-interactive).
 * - Generates a new keypair
 * - Sends public key to server (api.login)
 * - Stores private key PEM + email in config as "pending"
 */
const requestLoginCode = async (
  email: string,
  network: Network,
  force = false,
) => {
  // If the old "privateKey" exists, require --force
  if (config.get("privateKey") && !force)
    return Err(
      "By logging in, your private key will be erased. Re-run with --force to continue.",
    );

  const keys = await generateKeys();
  const loginResp = await api.login(email, keys.public);
  if (!loginResp.ok) return loginResp;

  const privPem = keys.private.export({ format: "pem", type: "pkcs8" });
  config.set(pendingEmailKey(network), email);
  config.set(pendingPrivKey(network), privPem);
  return Ok();
};

/**
 * Step 2: Confirm the login code (non-interactive).
 * - Validates the code format
 * - Calls api.auth(email, code)
 * - Promotes pending key/email into final config
 * - Clears pending state
 */
const confirmLoginCode = async (codeRaw: string, network: Network) => {
  const emailPending = config.get(pendingEmailKey(network));
  const keyPending = config.get(pendingPrivKey(network));

  if (!emailPending || !keyPending)
    return Err(
      "No pending login found for this network. Run `login request <email>` first.",
    );

  const code = Code(codeRaw);
  if (code instanceof type.errors) return Err(code.summary);

  const authResp = await api.auth(emailPending, code);
  if (!authResp.ok) return authResp;

  config.set(`${network}Email`, emailPending);
  config.set(`${network}Key`, keyPending);
  config.delete(pendingEmailKey(network));
  config.delete(pendingPrivKey(network));
  config.delete("privateKey");

  return Ok(emailPending);
};

const login = program
  .command("login")
  .description("Login with email (non-interactive 2-step flow)");

login
  .command("request")
  .description("Send an authentication code to the email address")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .option("-f, --force", "Overwrite existing private key if it exists")
  .argument("email", "The email to login with", parseEmail)
  .action(async (email: string, opts: { force?: boolean }) => {
    const network = getNetwork();
    const started = await requestLoginCode(email, network, !!opts.force);
    if (!started.ok) return logExit(started.error);

    printOk(
      { email, codeSent: true },
      `Login code sent to ${email}. Now run: login confirm <CODE>`,
    );
  });

login
  .command("confirm")
  .description("Confirm the authentication code and complete login")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .argument("code", "6-character authentication code")
  .action(async (code: string) => {
    const network = getNetwork();
    const email = await confirmLoginCode(code, network);
    if (!email.ok) return logExit(email.error);

    printOk(
      { email: email.data, loggedIn: true },
      `Logged in as ${email.data}`,
    );
  });
