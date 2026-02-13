import { CommanderError } from "commander";
import program, { logExit } from "./cli";
import "./commands/address";
import "./commands/balance";
import "./commands/config";
import "./commands/export-key";
import "./commands/import-key";
import "./commands/login";
import "./commands/send";
import "./commands/token";
import "./commands/withdraw";

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof CommanderError) {
    logExit(
      {
        code: error.code.split(".")[1] ?? "unknown",
        message: error.message,
      },
      error.exitCode,
      error.message,
    );
  } else {
    logExit(String(error));
  }
}
