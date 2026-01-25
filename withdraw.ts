import { type } from "arktype";
import { Decimal } from "decimal.js";
import ky from "ky";
import send from "send";
import { Err } from "ts-handling";
import { AddressEndpoints, type Network } from "./endpoints";
import resolveStablecoin from "./stablecoins";

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

  return send(amount, validatedResponse.contents.address, network);
};

export default withdraw;
