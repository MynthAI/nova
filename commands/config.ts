import program from "../cli";
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
