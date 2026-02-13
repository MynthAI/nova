import { createHash, randomBytes } from "crypto";
import Conf from "conf";
import { getMachineIdSync } from "native-machine-id";
import { Network } from "./endpoints";

type Settings = {
  localEmail?: string;
  localKey?: string;
  mainnetEmail?: string;
  mainnetKey?: string;
  network?: Network;
  privateKey?: string;
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
