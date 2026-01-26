import { type } from "arktype";
import { InvalidArgumentError } from "commander";
import { Decimal } from "decimal.js";
import { validate } from "./commands/address";
import { Networks } from "./endpoints";

const parseEmail = (value: string) => {
  const result = type("string.email")(value);

  if (result instanceof type.errors)
    throw new InvalidArgumentError(`email ${result.summary}`);

  return result;
};

const Amount = type("string.numeric")
  .pipe((v) => Decimal(v))
  .narrow((amount, ctx) => amount.gt(0) || ctx.mustBe("positive"));

const parseAmount = (value: string) => {
  const result = Amount(value);

  if (result instanceof type.errors)
    throw new InvalidArgumentError(`amount ${result.summary}`);

  return result;
};

const Email = type("string.email").pipe((v) => v.toLowerCase());

const Address = type(/^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/i)
  .narrow((address, ctx) => validate(address) || ctx.mustBe("valid address"))
  .pipe((v) => v.toLowerCase());

const parseDestination = (value: string) => {
  if (value.includes("@")) {
    const result = Email(value);

    if (result instanceof type.errors)
      throw new InvalidArgumentError(`destination ${result.summary}`);

    return result;
  }

  const result = Address(value);

  if (result instanceof type.errors)
    throw new InvalidArgumentError(`destination ${result.summary}`);

  return result;
};

const parseNetwork = (value: string) => {
  const result = type(["===", ...Networks])(value);

  if (result instanceof type.errors)
    throw new InvalidArgumentError(`network ${result.summary}`);

  return result;
};

const Stablecoin = type(["===", "USDA", "USDC", "USDM", "USDT"]);

const parseStablecoin = (value: string) => {
  const result = Stablecoin(value);

  if (result instanceof type.errors)
    throw new InvalidArgumentError(`stablecoin ${result.summary}`);

  return result;
};

const Blockchain = type([
  "===",
  "base",
  "cardano",
  "hyperliquid",
  "solana",
  "stable",
  "sui",
  "tron",
]);

const parseBlockchain = (value: string) => {
  const result = Blockchain(value);

  if (result instanceof type.errors)
    throw new InvalidArgumentError(`blockchain ${result.summary}`);

  return result;
};

export {
  parseAmount,
  parseBlockchain,
  parseDestination,
  parseEmail,
  parseNetwork,
  parseStablecoin,
};
