import { Command } from "commander";
import { Decimal } from "decimal.js";
import getAddress from "./address";
import getBalance from "./balance";
import config, { getNetwork } from "./config";
import createToken from "./create-token";
import { type Network } from "./endpoints";
import login from "./login";
import send from "./send";
import {
  parseAmount,
  parseBlockchain,
  parseDestination,
  parseEmail,
  parseNetwork,
  parseStablecoin,
} from "./validators";
import withdraw from "./withdraw";

const program = new Command();

program.name("nova").description("Nova CLI");

program
  .command("login")
  .description("Login with email")
  .argument("email", "The email to login with", parseEmail)
  .action((email: string) => {
    login(email, getNetwork());
  });

program
  .command("token")
  .description("Creates an authentication token after login")
  .action(async () => {
    const token = await createToken(getNetwork());
    if (!token.ok) return logExit(token.error);

    console.log(token.data);
  });

program
  .command("balance")
  .description("Gets current account balance")
  .action(async () => {
    const balance = await getBalance(getNetwork());
    if (!balance.ok) return logExit(balance.error);

    console.log(balance.data);
  });

program
  .command("address")
  .description("Gets account address")
  .action(async () => {
    const address = await getAddress(getNetwork());
    if (!address.ok) return logExit(address.error);

    console.log(address.data);
  });

program
  .command("send")
  .description("Send balance to another account")
  .argument("amount", "The amount of balance to send", parseAmount)
  .argument(
    "destination",
    "The email address or Mynth account address to send balance to",
    parseDestination,
  )
  .action(async (amount: Decimal, destination: string) => {
    const sent = await send(amount, destination, getNetwork());
    if (!sent.ok) return logExit(sent.error);

    console.log("Sent", amount, "to", destination);
  });

program
  .command("withdraw")
  .description("Withdraws balance to external blockchain")
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

      console.log("Withdrew", amount, "to", address);
    },
  );

const configCommand = program
  .command("config")
  .description("Manages nova configuration");

const get = configCommand
  .command("get")
  .description("Gets a configuration value");

get
  .command("network")
  .description("Gets the current configured network")
  .action(() => {
    console.log(getNetwork());
  });

const set = configCommand
  .command("set")
  .description("Sets a configuration value");

set
  .command("network")
  .description("Configures to the given network")
  .argument("network", "The network to set", parseNetwork)
  .action((network: Network) => {
    config.set("network", network);
    console.log("Set network to", network);
  });

const logExit = (message: string) => {
  process.exitCode = 1;
  console.error(message);
};

program.parseAsync(process.argv);
