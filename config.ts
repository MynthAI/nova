import { logExit } from "cli";
import Conf from "conf";
import { createHash, randomBytes } from "crypto";
import { existsSync, statSync } from "fs";
import { getMachineIdSync } from "native-machine-id";
import { isAbsolute, resolve } from "path";
import { Network } from "./endpoints";

type Settings = {
  localEmail?: string;
  localKey?: string;
  localPendingEmail?: string;
  localPendingKey?: string;
  mainnetEmail?: string;
  mainnetKey?: string;
  mainnetPendingEmail?: string;
  mainnetPendingKey?: string;
  network?: Network;
  privateKey?: string;
  testnetEmail?: string;
  testnetKey?: string;
  testnetPendingEmail?: string;
  testnetPendingKey?: string;
};

const defaultId = "e9f3edf961051d02";

const getEncryptionKey = () =>
  createHash("sha256")
    .update(getMachineIdSync() ?? defaultId, "hex")
    .digest("hex");

// The directory the user started the command from
// INIT_CWD is set via pnpm and nova.mjs; fallback to process.cwd()
const getLaunchCwd = () => process.env.INIT_CWD?.trim() || process.cwd();

const getConfigCwd = (): string | undefined => {
  const value = process.env.NOVA_CONFIG?.trim();
  if (!value) return undefined;

  try {
    const base = getLaunchCwd();

    // If NOVA_CONFIG is absolute, keep it; otherwise resolve relative to
    // cwd
    const fullPath = isAbsolute(value) ? value : resolve(base, value);

    if (existsSync(fullPath) && statSync(fullPath).isDirectory())
      return fullPath;
  } catch {}

  logExit("NOVA_CONFIG is not a valid directory path");
  process.exit(1);
};

const config = (() => {
  const cwd = getConfigCwd();

  try {
    return new Conf<Settings>({
      clearInvalidConfig: true,
      cwd,
      encryptionKey: getEncryptionKey(),
      projectName: "auth",
    });
  } catch {
    logExit(`${cwd} isn't writable`);
    process.exit(1);
  }
})();

const getNetwork = () => config.get("network") ?? "testnet";

const getPrivateKey = () => {
  const network = getNetwork();
  const email = config.get(`${network}Email`);
  const privateKey = config.get("privateKey");

  if (!email && !privateKey)
    config.set("privateKey", randomBytes(32).toString("hex"));

  return config.get("privateKey");
};

export default config;
export { getNetwork, getPrivateKey };
