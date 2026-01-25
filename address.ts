import { bech32 } from "@scure/base";
import ky from "ky";
import { mayFail, Ok } from "ts-handling";
import createToken from "./create-token";
import { AccountsEndpoints, type Network } from "./endpoints";
import { AddressResponse } from "./responses";

const getAddress = async (network: Network) => {
  const token = await createToken(network);
  if (!token.ok) return token;

  const endpoint = AccountsEndpoints[network];
  const response = await ky
    .get(`${endpoint}/address`, {
      headers: { Authorization: "Bearer " + token.data },
    })
    .json();
  const validatedResponse = AddressResponse.assert(response);
  const address = validatedResponse.contents.address;
  return Ok(address);
};

const validate = (address: string) => {
  const decoded = mayFail(() => bech32.decode(`m1q${address.toLowerCase()}`));
  if (!decoded.ok) return false;

  const { words } = decoded.data;
  if (words.length < 2) return false;

  const witnessVersion = words[0];
  if (witnessVersion !== 0) return false;

  const program = mayFail(() => bech32.fromWords(words.slice(1)));
  if (!program.ok) return false;

  return program.data.length === 20;
};

export default getAddress;
export { validate };
