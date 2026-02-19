import { encode } from "@msgpack/msgpack";
import { api } from "api";
import { randomBytes } from "crypto";
import { Decimal } from "decimal.js";
import { Ok } from "ts-handling";
import program, { logExit, printOk } from "../cli";
import { getNetwork, getPrivateKey } from "../config";
import { type Network } from "../endpoints";
import { signPayload, transformPrivateKey } from "../key-signer";
import { parseAmount, parseDestination } from "../validators";
import { createToken } from "./token";

type Address = string;
type Email = `${string}@${string}`;

const send = async (
  amount: Decimal,
  destination: Address | Email | undefined,
  network: Network,
) => {
  const token = await createToken(network);
  if (!token.ok) return token;

  const resolveResult = await resolve(destination);
  if (!resolveResult.ok) return resolveResult;
  const { to, url } = resolveResult.data;

  const transfer = await api.send(token.data, amount, to);
  if (!transfer.ok) return transfer;

  return Ok(url);
};

const sendWithPrivateKey = async (
  privateKey: string,
  amount: Decimal,
  destination: Address | Email | undefined,
) => {
  const finalPrivateKey = transformPrivateKey(privateKey);
  if (!finalPrivateKey.ok) return finalPrivateKey;

  const resolveResult = await resolve(destination);
  if (!resolveResult.ok) return resolveResult;
  const { to, url } = resolveResult.data;
  const nonce = randomBytes(32).toString("hex");
  const payload = encode({
    amount: amount.toString(),
    nonce,
    to,
  });
  const signature = await signPayload(payload, finalPrivateKey.data);

  const transfer = await api.send(nonce, signature, amount, to);
  if (!transfer.ok) return transfer;

  return Ok(url);
};

const sendWithTokenOrKey = (amount: Decimal, destination: Address | Email) => {
  const privateKey = getPrivateKey();
  if (privateKey) return sendWithPrivateKey(privateKey, amount, destination);

  return send(amount, destination, getNetwork());
};

const resolve = async (destination: Address | Email | undefined) => {
  if (!destination) {
    const link = await api.createLink();
    if (!link.ok) return link;
    return Ok({ to: link.data.address, url: link.data.url });
  }

  if (!destination.includes("@"))
    return Ok({ to: destination, url: undefined });

  const response = await api.resolve(destination);
  if (!response.ok) return response;
  return Ok({ to: response.data.contents.address, url: undefined });
};

type Result = {
  sent: true;
  amount: string;
  to?: string;
  claimUrl?: string;
};

const createResult = (
  amount: Decimal,
  destination: string | undefined,
  sent: { data?: string },
) => {
  const result: Result = {
    sent: true,
    amount: amount.toString(),
  };
  const to = destination ?? sent.data ?? null;
  const claimUrl = destination ? null : (sent.data ?? null);
  if (claimUrl) result.claimUrl = claimUrl;
  else if (to) result.to = to;
  return result;
};

program
  .command("send")
  .description("Send balance to another account")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .argument("amount", "The amount of balance to send", parseAmount)
  .argument(
    "[destination]",
    "The email address or Mynth account address to send balance to. If omitted then a claim link will be created.",
    parseDestination,
  )
  .action(async (amount: Decimal, destination?: string) => {
    const privateKey = getPrivateKey();
    if (privateKey) {
      const sent = await sendWithPrivateKey(privateKey, amount, destination);
      if (!sent.ok) return logExit(sent.error);

      printOk(
        createResult(amount, destination, sent),
        `Sent ${amount} to ${destination ?? sent.data}`,
      );
      return;
    }

    const sent = await send(amount, destination, getNetwork());
    if (!sent.ok) return logExit(sent.error);

    printOk(
      createResult(amount, destination, sent),
      `Sent ${amount} to ${destination ?? sent.data}`,
    );
  });

export { sendWithTokenOrKey };
