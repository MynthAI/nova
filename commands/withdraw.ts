import { Decimal } from "decimal.js";
import { Err } from "ts-handling";
import { api } from "../api";
import program, { logExit, printOk } from "../cli";
import { getNetwork } from "../config";
import type { Network } from "../endpoints";
import resolveStablecoin from "../stablecoins";
import { parseAmount, parseBlockchain, parseStablecoin } from "../validators";
import { sendWithTokenOrKey } from "./send";

const withdraw = async (
  amount: Decimal,
  stablecoin: string,
  address: string,
  blockchain: string,
  network: Network,
) => {
  const token = resolveStablecoin(stablecoin, blockchain, network);
  if (!token) return Err(`${stablecoin} does not exist for ${blockchain}`);

  const response = await api.generate(
    {
      address,
      blockchain,
      token,
    },
    amount,
  );
  if (!response.ok) return response;

  return sendWithTokenOrKey(amount, response.data.contents.address);
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
          blockchain,
          stablecoin,
          to: address,
          txId: withdrawn.data.txId,
        },
        `Withdrew ${amount} to ${address}; ${withdrawn.data.txId}`,
      );
    },
  );
