import program, { printOk } from "../cli";
import config, { getNetwork } from "../config";
import { type Network } from "../endpoints";
import { parseNetwork } from "../validators";

const configCommand = program
  .command("config")
  .description("Manages nova configuration");

const get = configCommand
  .command("get")
  .description("Gets a configuration value");

get
  .command("network")
  .description("Gets the current configured network")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .action(() => {
    const network = getNetwork();
    printOk({ network }, network);
  });

const set = configCommand
  .command("set")
  .description("Sets a configuration value");

set
  .command("network")
  .description("Configures to the given network")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .argument("network", "The network to set", parseNetwork)
  .action((network: Network) => {
    config.set("network", network);
    printOk({ network }, `Set network to ${network}`);
  });
