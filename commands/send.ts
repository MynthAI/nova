import { encode } from "@msgpack/msgpack";
import { type } from "arktype";
import { randomBytes } from "crypto";
import { Decimal } from "decimal.js";
import ky from "ky";
import { Err, Ok } from "ts-handling";
import program, { logExit, printOk } from "../cli";
import { getNetwork, getPrivateKey } from "../config";
import { AccountsEndpoints, type Network } from "../endpoints";
import { signPayload, transformPrivateKey } from "../key-signer";
import {
  AddressResponse,
  LinkCreatedResponse,
  ValidationErrorResponse,
} from "../responses";
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

  const endpoint = AccountsEndpoints[network];
  const { to, url } = await resolve(destination, endpoint);

  const transfer = await postTransfer(
    endpoint,
    {
      amount: amount.toString(),
      nonce: randomBytes(32).toString("hex"),
      to,
    },
    token.data,
  );
  if (!transfer.ok) return transfer;

  return Ok(url);
};

const sendWithPrivateKey = async (
  privateKey: string,
  amount: Decimal,
  destination: Address | Email | undefined,
  network: Network,
) => {
  const finalPrivateKey = transformPrivateKey(privateKey);
  if (!finalPrivateKey.ok) return finalPrivateKey;

  const endpoint = AccountsEndpoints[network];
  const { to, url } = await resolve(destination, endpoint);
  const nonce = randomBytes(32).toString("hex");
  const payload = encode({
    amount: amount.toString(),
    nonce,
    to,
  });
  const signature = await signPayload(payload, finalPrivateKey.data);

  const transfer = await postTransfer(endpoint, {
    amount: amount.toString(),
    nonce,
    signature,
    to,
  });
  if (!transfer.ok) return transfer;

  return Ok(url);
};

const sendWithTokenOrKey = (amount: Decimal, destination: Address | Email) => {
  const privateKey = getPrivateKey();
  if (privateKey)
    return sendWithPrivateKey(privateKey, amount, destination, getNetwork());

  return send(amount, destination, getNetwork());
};

const createLink = async (endpoint: string) => {
  const response = await ky.post(`${endpoint}/create-link`).json();
  const linkResponse = LinkCreatedResponse.assert(response);
  const domain = new URL(endpoint).origin;
  const url = `${domain}/c/${linkResponse.contents.token}`;
  return {
    address: linkResponse.contents.address,
    url,
  };
};

const resolve = async (
  destination: Address | Email | undefined,
  endpoint: string,
) => {
  if (!destination) {
    const link = await createLink(endpoint);
    return { to: link.address, url: link.url };
  }

  if (!destination.includes("@")) return { to: destination, url: undefined };

  const response = await ky
    .get(`${endpoint}/resolve`, { searchParams: { email: destination } })
    .json();
  const addressResponse = AddressResponse.assert(response);
  return { to: addressResponse.contents.address, url: undefined };
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

const parseTransferError = async (result: Response) => {
  const data = await result.json();
  const validationError = ValidationErrorResponse(data);
  if (validationError instanceof type.errors) return Err("Unknown " + data);

  return Err(
    validationError.contents.errors.map((error) => error.message).join("; "),
  );
};

const postTransfer = async (
  endpoint: string,
  body: Record<string, unknown>,
  authToken?: string,
) => {
  const result = await ky.post(`${endpoint}/transfer`, {
    headers: authToken ? { Authorization: "Bearer " + authToken } : undefined,
    json: body,
    throwHttpErrors: false,
  });

  if (result.status === 200) return Ok(undefined);
  return parseTransferError(result);
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
      const sent = await sendWithPrivateKey(
        privateKey,
        amount,
        destination,
        getNetwork(),
      );
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
