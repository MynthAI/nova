import { Bytes, getPublicKeyAsync } from "@noble/ed25519";
import { blake3 } from "@noble/hashes/blake3.js";
import { bech32 } from "@scure/base";
import ky from "ky";
import { mayFail, Ok } from "ts-handling";
import program, { logExit } from "../cli";
import config, { getNetwork } from "../config";
import { AccountsEndpoints, type Network } from "../endpoints";
import { transformPrivateKey } from "../key-signer";
import { AddressResponse } from "../responses";
import { createToken } from "./token";

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

const getAddressFromPublicKey = async (publicKey: Bytes) => {
  const publicKeyHash = blake3(publicKey, { dkLen: 20 });

  const words = bech32.toWords(publicKeyHash);
  const address = bech32.encode("m", [0, ...words]).slice(3);
  if (!validate(address)) throw new Error("implementation incorrect");
  return address;
};

const getAddressFromPrivateKey = async (privateKey: string) => {
  const finalPrivateKey = transformPrivateKey(privateKey);
  if (!finalPrivateKey.ok) return finalPrivateKey;

  const publicKey = await getPublicKeyAsync(finalPrivateKey.data);
  return Ok(await getAddressFromPublicKey(publicKey));
};

const getAddressFromTokenOrKey = async () => {
  const privateKey = config.get("privateKey");
  if (privateKey) return getAddressFromPrivateKey(privateKey);

  return getAddress(getNetwork());
};

program
  .command("address")
  .description("Gets account address")
  .action(async () => {
    const privateKey = config.get("privateKey");
    if (privateKey) {
      const address = await getAddressFromPrivateKey(privateKey);
      if (!address.ok) return logExit(address.error);

      console.log(address.data);
      return;
    }

    const address = await getAddress(getNetwork());
    if (!address.ok) return logExit(address.error);

    console.log(address.data);
  });

export { getAddressFromPublicKey, getAddressFromTokenOrKey, validate };
