import ky from "ky";
import { Ok } from "ts-handling";
import createToken from "./create-token";
import { AccountsEndpoints, type Network } from "./endpoints";
import { BalanceResponse } from "./responses";

const getBalance = async (network: Network) => {
  const token = await createToken(network);
  if (!token.ok) return token;

  const endpoint = AccountsEndpoints[network];
  const response = await ky
    .get(`${endpoint}/balance`, {
      headers: { Authorization: "Bearer " + token.data },
    })
    .json();
  const validatedResponse = BalanceResponse.assert(response);
  const balance = validatedResponse.contents.balance;
  return Ok(balance);
};

export default getBalance;
