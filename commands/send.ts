import { randomBytes } from "crypto";
import { encode } from "@msgpack/msgpack";
import { Decimal } from "decimal.js";
import ky from "ky";
import { Ok } from "ts-handling";
import program, { logExit } from "../cli";
import config, { getNetwork } from "../config";
import { AccountsEndpoints, type Network } from "../endpoints";
import { signPayload, transformPrivateKey } from "../key-signer";
import { AddressResponse } from "../responses";
import { parseAmount, parseDestination } from "../validators";
import { createToken } from "./token";

type Address = string;
type Email = `${string}@${string}`;

const send = async (
  amount: Decimal,
  destination: Address | Email,
  network: Network,
) => {
  const token = await createToken(network);
  if (!token.ok) return token;

  const endpoint = AccountsEndpoints[network];
  const to = destination.includes("@")
    ? await resolve(destination as Email, endpoint)
    : destination;
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
  return Ok();
};

const sendWithPrivateKey = async (
  privateKey: string,
  amount: Decimal,
  destination: Address | Email,
  network: Network,
) => {
  const finalPrivateKey = transformPrivateKey(privateKey);
  if (!finalPrivateKey.ok) return finalPrivateKey;

  const endpoint = AccountsEndpoints[network];
  const to = destination.includes("@")
    ? await resolve(destination as Email, endpoint)
    : destination;
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
  return Ok();
};

const sendWithTokenOrKey = (amount: Decimal, destination: Address | Email) => {
  const privateKey = config.get("privateKey");
  if (privateKey)
    return sendWithPrivateKey(privateKey, amount, destination, getNetwork());

  return send(amount, destination, getNetwork());
};

const resolve = async (email: Email, endpoint: string) => {
  const response = await ky
    .get(`${endpoint}/resolve`, { searchParams: { email } })
    .json();
  const addressResponse = AddressResponse.assert(response);
  return addressResponse.contents.address;
};

program
  .command("send")
  .description("Send balance to another account")
  .argument("amount", "The amount of balance to send", parseAmount)
  .argument(
    "destination",
    "The email address or Mynth account address to send balance to",
    parseDestination,
  )
  .action(async (amount: Decimal, destination: string) => {
    const privateKey = config.get("privateKey");
    if (privateKey) {
      const sent = await sendWithPrivateKey(
        privateKey,
        amount,
        destination,
        getNetwork(),
      );
      if (!sent.ok) return logExit(sent.error);

      console.log("Sent", amount, "to", destination);
      return;
    }

    const sent = await send(amount, destination, getNetwork());
    if (!sent.ok) return logExit(sent.error);

    console.log("Sent", amount, "to", destination);
  });

export { sendWithTokenOrKey };
