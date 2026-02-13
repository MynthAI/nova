import { type } from "arktype";
import { Decimal } from "decimal.js";
import ky from "ky";
import { Err } from "ts-handling";
import program, { logExit, printOk } from "../cli";
import { getNetwork } from "../config";
import { AddressEndpoints, type Network } from "../endpoints";
import resolveStablecoin from "../stablecoins";
import { parseAmount, parseBlockchain, parseStablecoin } from "../validators";
import { sendWithTokenOrKey } from "./send";

const Response = type({
  code: "200",
  contents: {
    address: "string",
  },
});

const ErrorResponse = type({
  code: "400",
  contents: {
    errors: type({
      code: "'VALIDATION'",
      message: "string",
    })
      .array()
      .atLeastLength(1),
  },
});

const withdraw = async (
  amount: Decimal,
  stablecoin: string,
  address: string,
  blockchain: string,
  network: Network,
) => {
  const endpoint = AddressEndpoints[network];
  const token = resolveStablecoin(stablecoin, blockchain, network);
  if (!token) return Err(`${stablecoin} does not exist for ${blockchain}`);

  const response = await ky
    .post(`${endpoint}/generate`, {
      json: {
        source: {
          blockchain: "mynth",
          token: "usd",
        },
        target: {
          address,
          blockchain,
          token,
        },
        amount: amount.toString(),
        providerId: "novaswap",
      },
      throwHttpErrors: false,
    })
    .json();
  const validatedResponse = Response(response);

  if (validatedResponse instanceof type.errors) {
    const errors = ErrorResponse.assert(response);
    return Err(errors.contents.errors[0].message);
  }

  return sendWithTokenOrKey(amount, validatedResponse.contents.address);
};

program
  .command("withdraw")
  .description("Withdraws balance to external blockchain")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .argument("amount", "The amount of balance to withdraw", parseAmount)
  .argument(
    "stablecoin",
    "The stablecoin to withdraw balance as",
    parseStablecoin,
  )
  .argument("address", "The blockchain address to send the stablecoin to")
  .argument(
    "blockchain",
    "The blockchain to send the stablecoin to. Set this if blockchain cannot be inferred from address.",
    parseBlockchain,
  )
  .action(
    async (
      amount: Decimal,
      stablecoin: string,
      address: string,
      blockchain: string,
    ) => {
      const withdrawn = await withdraw(
        amount,
        stablecoin,
        address,
        blockchain,
        getNetwork(),
      );
      if (!withdrawn.ok) return logExit(withdrawn.error);

      printOk(
        {
          amount: amount.toString(),
          stablecoin,
          to: address,
          blockchain,
        },
        `Withdrew ${amount} to ${address}`,
      );
    },
  );
