import { getPublicKeyAsync, signAsync, verifyAsync } from "@noble/ed25519";
import { blake3 } from "@noble/hashes/blake3.js";
import { type } from "arktype";
import { Err, Ok } from "ts-handling";
import { getAddressFromPublicKey } from "./commands/address.js";

const Signature = type("string == 128")
  .and(/^[A-Za-z0-9_-]+$/)
  .pipe((signature, ctx) => {
    try {
      return new Uint8Array(Buffer.from(signature, "base64url"));
    } catch {
      return ctx.error("valid base64url encoded signature");
    }
  });

type Signature = typeof Signature.inferIn;

const PrivateKey = type("string.hex == 32").or("string.hex == 64");

const transformPrivateKey = (privateKey: string) => {
  const validatedPrivateKey = PrivateKey(privateKey);
  if (validatedPrivateKey instanceof type.errors)
    return Err(validatedPrivateKey.summary);

  const privateKeyBytes = Buffer.from(validatedPrivateKey, "hex");
  const finalPrivateKey =
    privateKeyBytes.length == 32
      ? privateKeyBytes
      : blake3(privateKeyBytes, { dkLen: 32 });

  return Ok(finalPrivateKey);
};

const signPayload = async (
  payload: Uint8Array,
  privateKey: Uint8Array,
): Promise<Signature> => {
  if (privateKey.length < 16)
    throw new Error("not enough entropy in private key");
  if (privateKey.length != 32) privateKey = blake3(privateKey, { dkLen: 32 });

  if (payload.length < 1) throw new Error("payload must not be empty");

  const signature = await signAsync(payload, privateKey);
  const publicKey = await getPublicKeyAsync(privateKey);

  const combined = new Uint8Array(96);
  combined.set(publicKey, 0);
  combined.set(signature, 32);
  return Buffer.from(combined).toString("base64url");
};

const verifySignedPayload = async (
  payload: Uint8Array,
  signature: Signature,
): Promise<string | false> => {
  if (payload.length < 1) throw new Error("payload must not be empty");

  const signatureBytes = Signature(signature);
  if (signatureBytes instanceof type.errors)
    throw new Error(`signature ${signatureBytes.summary}`);

  const publicKey = signatureBytes.slice(0, 32);
  const baseSignature = signatureBytes.slice(32, 96);
  const [address, verified] = await Promise.all([
    getAddressFromPublicKey(publicKey),
    verifyAsync(baseSignature, payload, publicKey),
  ]);
  if (!verified) return false;
  return address;
};

export { transformPrivateKey, signPayload, verifySignedPayload };
