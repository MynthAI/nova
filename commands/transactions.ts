import { Ok } from "ts-handling";
import { api } from "../api.js";
import program, { logExit, printOk } from "../cli.js";
import { getAddressFromTokenOrKey } from "./address.js";

const getTransactions = async (address?: string) => {
  const resolvedAddress = address
    ? Ok(address)
    : await getAddressFromTokenOrKey();
  if (!resolvedAddress.ok) return resolvedAddress;

  const response = await api.getTransactions(resolvedAddress.data);
  if (!response.ok) return response;
  return Ok(response.data.contents.transactions);
};

program
  .command("transactions")
  .description("Shows transactions for an account")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .argument("[address]", "The account address to get transactions for")
  .action(async (address: string | undefined) => {
    const transactions = await getTransactions(address);
    if (!transactions.ok) return logExit(transactions.error);

    const humanReadable =
      transactions.data.length === 0
        ? "No transactions"
        : transactions.data
            .map((tx) => `${tx.type} ${tx.amount} (${tx.txId})`)
            .join("\n");

    printOk({ transactions: transactions.data }, humanReadable);
  });

export { getTransactions };
