import { Ok } from "ts-handling";
import { api } from "../api.js";
import program, { logExit, printOk } from "../cli.js";
import { getAddressFromTokenOrKey } from "./address.js";

const getBalance = async () => {
  const address = await getAddressFromTokenOrKey();
  if (!address.ok) return address;

  const response = await api.getBalance(address.data);
  if (!response.ok) return response;
  const balance = response.data.contents.balance;
  return Ok(balance);
};

program
  .command("balance")
  .description("Gets current account balance")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .action(async () => {
    const balance = await getBalance();
    if (!balance.ok) return logExit(balance.error);

    printOk(
      { balance: balance.data, currency: "usd" },
      balance.data.toString(),
    );
  });
