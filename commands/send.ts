import { randomBytes } from "crypto";
import { encode } from "@msgpack/msgpack";
import { Decimal } from "decimal.js";
import ky from "ky";
import { Ok } from "ts-handling";
import program, { logExit } from "../cli";
import { getNetwork, getPrivateKey } from "../config";
import { AccountsEndpoints, type Network } from "../endpoints";
import { signPayload, transformPrivateKey } from "../key-signer";
import { AddressResponse, LinkCreatedResponse } from "../responses";
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
  await ky
    .post(`${endpoint}/transfer`, {
      headers: { Authorization: "Bearer " + token.data },
      json: {
        amount: amount.toString(),
        nonce: randomBytes(32).toString("hex"),
        to,
      },
    })
    .json();
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
  await ky
    .post(`${endpoint}/transfer`, {
      json: {
        amount: amount.toString(),
        nonce,
        signature,
        to,
      },
    })
    .json();
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

program
  .command("send")
  .description("Send balance to another account")
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

      console.log("Sent", amount, "to", destination ?? sent.data);
      return;
    }

    const sent = await send(amount, destination, getNetwork());
    if (!sent.ok) return logExit(sent.error);

    console.log("Sent", amount, "to", destination ?? sent.data);
  });

export { sendWithTokenOrKey };
