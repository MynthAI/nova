import { Bytes, getPublicKeyAsync } from "@noble/ed25519";
import { blake3 } from "@noble/hashes/blake3.js";
import { bech32 } from "@scure/base";
import { Argument } from "commander";
import ky from "ky";
import { mayFail, Ok } from "ts-handling";
import program, { logExit, printOk } from "../cli";
import { getNetwork, getPrivateKey } from "../config";
import { AccountsEndpoints, type Network } from "../endpoints";
import { transformPrivateKey } from "../key-signer";
import { AddressResponse } from "../responses";
import { createToken } from "./token";

const Blockchains = [
  "base",
  "cardano",
  "hyperliquid",
  "mynth",
  "plasma",
  "solana",
  "stable",
  "sui",
  "tron",
] as const;
type Blockchain = (typeof Blockchains)[number];

const BlockchainMap = {
  base: "evm",
  cardano: "cardano",
  hyperliquid: "evm",
  mynth: "address",
  plasma: "evm",
  solana: "solana",
  stable: "evm",
  sui: "sui",
  tron: "tron",
} as const;

const getAddressViaAuth = async (network: Network, blockchain: Blockchain) => {
  const token = await createToken(network);
  if (!token.ok) return token;

  const endpoint = AccountsEndpoints[network];
  const response = await ky
    .get(`${endpoint}/address`, {
      headers: { Authorization: "Bearer " + token.data },
    })
    .json();
  const validatedResponse = AddressResponse.assert(response);
  const address = validatedResponse.contents[BlockchainMap[blockchain]];
  return Ok(address);
};

const getAddressViaPrivateKey = async (
  privateKey: string,
  network: Network,
  blockchain: Blockchain,
) => {
  const address = await getAddressFromPrivateKey(privateKey);
  if (!address.ok) return address;
  if (blockchain === "mynth") return Ok(address.data);

  const endpoint = AccountsEndpoints[network];
  const response = await ky
    .get(`${endpoint}/address`, {
      searchParams: { address: address.data },
    })
    .json();
  const validatedResponse = AddressResponse.assert(response);
  return Ok(validatedResponse.contents[BlockchainMap[blockchain]]);
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
  const privateKey = getPrivateKey();
  if (privateKey) return getAddressFromPrivateKey(privateKey);

  return getAddressViaAuth(getNetwork(), "mynth");
};

program
  .command("address")
  .description("Gets account address")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .addArgument(
    new Argument("[blockchain]", "The blockchain to get the address for")
      .choices(Blockchains)
      .default("mynth"),
  )
  .action(async (blockchain: Blockchain) => {
    const network = getNetwork();
    const privateKey = getPrivateKey();
    if (privateKey) {
      const address = await getAddressViaPrivateKey(
        privateKey,
        network,
        blockchain,
      );
      if (!address.ok) return logExit(address.error);

      printOk({ address: address.data, blockchain, network }, address.data);
      return;
    }

    const address = await getAddressViaAuth(getNetwork(), blockchain);
    if (!address.ok) return logExit(address.error);

    printOk({ address: address.data, blockchain, network }, address.data);
  });

export { getAddressFromPublicKey, getAddressFromTokenOrKey, validate };
