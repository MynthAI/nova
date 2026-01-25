import { randomBytes } from "crypto";
import { Decimal } from "decimal.js";
import ky from "ky";
import { Ok } from "ts-handling";
import createToken from "./create-token";
import { AccountsEndpoints, type Network } from "./endpoints";
import { AddressResponse } from "./responses";

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

const resolve = async (email: Email, endpoint: string) => {
  const response = await ky
    .get(`${endpoint}/resolve`, { searchParams: { email } })
    .json();
  const addressResponse = AddressResponse.assert(response);
  return addressResponse.contents.address;
};

export default send;
