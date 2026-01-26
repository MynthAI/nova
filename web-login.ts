import { keygenAsync, signAsync, type Bytes } from "@noble/ed25519";
import { WebBuf } from "@webbuf/webbuf";
import { type } from "arktype";
import ky from "ky";
import { getRandomValues } from "uncrypto";

const TokenResponse = type({
  contents: {
    token: "string",
  },
});

const endpoint = "https://www.mynth.ai/api";
// For testnet, use https://preview.mynth.ai/api

const generateKeys = async () => {
  const { publicKey, secretKey } = await keygenAsync();
  return {
    public: WebBuf.from(publicKey).toHex(),
    private: secretKey,
  };
};

const signPayload = async (payload: Bytes, privateKey: Bytes) => {
  const signature = await signAsync(payload, privateKey);
  return WebBuf.from(signature).toBase64();
};

const login = async (email: string) => {
  const keys = await generateKeys();
  await ky.post(`${endpoint}/auth/login`, {
    json: { email, publicKey: keys.public },
  });

  // Code is emailed to user. Have user enter code to continue
  const code = "ENVMLV"; // example
  await ky.post(`${endpoint}/auth/auth`, { json: { code, email } });

  const nonce = new Uint8Array(32);
  getRandomValues(new Uint8Array(32));
  const signature = await signPayload(nonce, keys.private);
  const response = await ky
    .post(`${endpoint}/auth/create-token`, {
      json: {
        email,
        nonce: WebBuf.from(nonce).toHex(),
        signature,
      },
    })
    .json();
  return TokenResponse.assert(response).contents.token;
};

const AddressResponse = type({
  contents: {
    address: "string",
  },
});

const getAddress = async (token: string) => {
  const response = await ky
    .get(`${endpoint}/accounts/address`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .json();
  const address = AddressResponse.assert(response).contents.address;
  return address;
};

login("example@gmail.com"); // User to input email address
getAddress("d92bccee64b8c1f218ec4863b5a35bc5"); // use token from login()
