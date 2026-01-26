import ky from "ky";
import { Ok } from "ts-handling";
import program, { logExit } from "../cli";
import { getNetwork } from "../config";
import { AccountsEndpoints, type Network } from "../endpoints";
import { BalanceResponse } from "../responses";
import { getAddressFromTokenOrKey } from "./address";

const getBalance = async (network: Network) => {
  const address = await getAddressFromTokenOrKey();
  if (!address.ok) return address;

  const endpoint = AccountsEndpoints[network];
  const response = await ky
    .get(`${endpoint}/balance`, {
      searchParams: { address: address.data },
    })
    .json();
  const validatedResponse = BalanceResponse.assert(response);
  const balance = validatedResponse.contents.balance;
  return Ok(balance);
};

program
  .command("balance")
  .description("Gets current account balance")
  .action(async () => {
    const balance = await getBalance(getNetwork());
    if (!balance.ok) return logExit(balance.error);

    console.log(balance.data);
  });
