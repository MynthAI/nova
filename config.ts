import { createHash } from "crypto";
import Conf from "conf";
import { getMachineIdSync } from "native-machine-id";
import { Network } from "./endpoints";

type Settings = {
  localEmail?: string;
  localKey?: string;
  mainnetEmail?: string;
  mainnetKey?: string;
  network?: Network;
  testnetEmail?: string;
  testnetKey?: string;
};

const defaultId = "e9f3edf961051d02";

const getEncryptionKey = () =>
  createHash("sha256")
    .update(getMachineIdSync() ?? defaultId, "hex")
    .digest("hex");

const config = new Conf<Settings>({
  clearInvalidConfig: true,
  encryptionKey: getEncryptionKey(),
  projectName: "auth",
});

const getNetwork = () => config.get("network") ?? "testnet";

export default config;
export { getNetwork };
