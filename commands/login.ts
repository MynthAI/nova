import { api } from "api";
import { type } from "arktype";
import { Err, Ok } from "ts-handling";
import { generateKeys } from "../auth-signer";
import program, { logExit, printOk } from "../cli";
import config, { getNetwork } from "../config";
import { type Network } from "../endpoints";
import { parseEmail } from "../validators";

const Code = type("string.alphanumeric == 6");

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
  // If the old "privateKey" exists, require --force since we can't prompt
  if (config.get("privateKey") && !force)
    return Err(
      "By logging in, your private key will be erased. Re-run with --force to continue.",
    );

  // If there's an in-progress login, you can choose to block or overwrite
  // This blocks unless --force is provided
  const existingPending =
    config.get(pendingPrivKey(network)) || config.get(pendingEmailKey(network));
  if (existingPending && !force)
    return Err(
      "A login is already pending for this network. Run `login confirm ...` to finish, or re-run `login request ... --force` to overwrite.",
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

  const code = codeRaw.trim().toUpperCase();
  const parsed = Code(code);
  if (parsed instanceof type.errors) return Err(parsed.summary);

  const authResp = await api.auth(emailPending, code);
  if (!authResp.ok) return authResp;

  config.set(`${network}Email`, emailPending);
  config.set(`${network}Key`, keyPending);
  config.delete(pendingEmailKey(network));
  config.delete(pendingPrivKey(network));
  config.delete("privateKey");

  return Ok();
};

const login = program
  .command("login")
  .description("Login with email (non-interactive 2-step flow)");

login
  .command("request")
  .description("Send an authentication code to the email address")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .option(
    "-f, --force",
    "Overwrite existing keys/pending login without prompting",
  )
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
  .action(async (email: string, code: string) => {
    const network = getNetwork();
    const finished = await confirmLoginCode(code, network);
    if (!finished.ok) return logExit(finished.error);

    printOk({ email, loggedIn: true }, `Logged in as ${email}`);
  });
