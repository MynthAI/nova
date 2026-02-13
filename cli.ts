import { encode } from "@toon-format/toon";
import { Command } from "commander";
import stringify from "safe-stable-stringify";

const program = new Command();

program
  .name("nova")
  .description("Nova CLI")
  .option("-j, --json", "Output results as JSON")
  .option("-t, --toon", "Output results as TOON")
  .exitOverride()
  .configureOutput({
    writeOut: () => {},
    writeErr: () => {},
  });

const argvWantsJson = () =>
  process.argv.includes("--json") || process.argv.includes("-j");

const argvWantsToon = () =>
  process.argv.includes("--toon") || process.argv.includes("-t");

const wantsJsonOutput = () => Boolean(program.opts().json) || argvWantsJson();

const wantsToonOutput = () => Boolean(program.opts().toon) || argvWantsToon();

const formatOutput = (payload: object) => {
  if (wantsJsonOutput()) return stringify(payload) + "\n";
  if (wantsToonOutput()) return encode(payload) + "\n";
  throw new Error("invalid call");
};

const printOk = (result: object, humanReadable?: string) => {
  if (wantsJsonOutput() || wantsToonOutput()) {
    const payload = { status: "ok", result };
    process.stdout.write(formatOutput(payload));
    return;
  }

  console.log(humanReadable === undefined ? result : humanReadable);
};

const logExit = (
  message: string | object,
  exitCode = 1,
  humanReadable?: string,
) => {
  process.exitCode = exitCode;

  if (wantsJsonOutput() || wantsToonOutput()) {
    const error = typeof message === "string" ? { message } : message;
    const payload = { status: "error", error: { ...error, exitCode } };
    process.stdout.write(formatOutput(payload));
    return;
  }

  console.error(humanReadable === undefined ? message : humanReadable);
};

export default program;
export { logExit, printOk };
