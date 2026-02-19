import { CommanderError } from "commander";
import program, { getHelp, logExit, printOk } from "./cli.js";
import "./commands/address.js";
import "./commands/balance.js";
import "./commands/config.js";
import "./commands/export-key.js";
import "./commands/import-key.js";
import "./commands/login.js";
import "./commands/send.js";
import "./commands/token.js";
import "./commands/withdraw.js";

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof CommanderError)
    if (error.code.includes("commander.help")) {
      const help = getHelp();
      printOk({ help: help.replace(/\s+/g, " ").trim() }, help.trim());
    } else {
      logExit(
        {
          code: error.code.split(".")[1] ?? "unknown",
          message: error.message,
        },
        error.message,
      );
    }
  else logExit(String(error));
}
