import { Command } from "commander";

const program = new Command();

program.name("nova").description("Nova CLI");

const logExit = (message: string, exitCode = 1) => {
  process.exitCode = exitCode;
  console.error(message);
};

export default program;
export { logExit };
