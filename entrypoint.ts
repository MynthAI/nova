import program from "./cli";
import "./commands/address";
import "./commands/balance";
import "./commands/config";
import "./commands/export-key";
import "./commands/import-key";
import "./commands/login";
import "./commands/send";
import "./commands/token";
import "./commands/withdraw";

program.parseAsync(process.argv);
