import { type } from "arktype";
import { Decimal } from "decimal.js";

const BalanceResponse = type({
  code: "200",
  contents: {
    balance: type("string.numeric").pipe((v) => Decimal(v)),
  },
});

export { BalanceResponse };
