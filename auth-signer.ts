import { generateKeyPair, sign, type KeyObject } from "crypto";
import { promisify } from "util";
import { type } from "arktype";

const generateKeyPairAsync = promisify(generateKeyPair);

const Ed25519PublicJwk = type({ x: "string" });

const generateKeys = async () => {
  const { publicKey, privateKey } = await generateKeyPairAsync("ed25519");
  const jwk = Ed25519PublicJwk.assert(publicKey.export({ format: "jwk" }));
  const publicKeyBytes = Buffer.from(jwk.x, "base64url");
  return { public: publicKeyBytes.toString("hex"), private: privateKey };
};

const signPayload = (payload: Buffer, privateKey: KeyObject) => {
  const signature = sign(null, payload, privateKey);
  return signature.toString("base64");
};

export { generateKeys, signPayload };
