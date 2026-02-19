import { type } from "arktype";
import { randomBytes } from "crypto";
import { Decimal } from "decimal.js";
import ky, { type KyInstance } from "ky";
import { Err, Ok, type Result } from "ts-handling";
import { getNetwork } from "./config";
import {
  AccountsEndpoints,
  AddressEndpoints,
  AuthEndpoints,
  type Network,
} from "./endpoints";
import {
  AddressResponse,
  BalanceResponse,
  GenerateResponse,
  LinkCreatedResponse,
  RateLimited,
  TokenCreatedResponse,
  ValidationErrorResponse,
} from "./responses";

const Address = type(/^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/i).pipe((v) =>
  v.toLowerCase(),
);

class NovaApiClient {
  private readonly http: KyInstance;

  constructor(private readonly network: Network) {
    this.http = ky.create({
      throwHttpErrors: false,
      retry: { retryOnTimeout: true },
    });
  }

  async getAddress(addressOrToken: string) {
    const address = Address(addressOrToken);
    if (address instanceof type.errors)
      return this.getAddressViaToken(addressOrToken);
    return this.getAddressViaAddress(address);
  }

  async getBalance(address: string) {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http
      .get(`${endpoint}/balance`, { searchParams: { address } })
      .json();
    const validatedResponse = BalanceResponse(response);
    if (validatedResponse instanceof type.errors) return parseError(response);
    return Ok(validatedResponse);
  }

  async login(email: string, publicKey: string) {
    const endpoint = AuthEndpoints[this.network];
    const response = await this.http.post(`${endpoint}/login`, {
      json: { email, publicKey },
    });

    if (response.status > 299) return parseError(await response.json());
    return Ok();
  }

  async auth(email: string, code: string) {
    const endpoint = AuthEndpoints[this.network];
    const response = await this.http.post(`${endpoint}/auth`, {
      json: { email, code },
    });
    if (response.status !== 201) return parseError(await response.json());
    return Ok();
  }

  async send(
    authToken: string,
    amount: Decimal,
    to: string,
  ): Promise<Result<void, string>>;
  async send(
    nonce: string,
    signature: string,
    amount: Decimal,
    to: string,
  ): Promise<Result<void, string>>;
  async send(
    ...args: [string, Decimal, string] | [string, string, Decimal, string]
  ) {
    if (args.length === 3) {
      const [authToken, amount, to] = args;
      return this.sendViaAuth(authToken, amount, to);
    }

    const [nonce, signature, amount, to] = args;
    return this.sendViaKey(nonce, signature, amount, to);
  }

  async resolve(email: string) {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http
      .get(`${endpoint}/resolve`, { searchParams: { email } })
      .json();
    const validatedResponse = AddressResponse(response);
    if (validatedResponse instanceof type.errors) return parseError(response);
    return Ok(validatedResponse);
  }

  async createLink() {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http.post(`${endpoint}/create-link`).json();
    const linkResponse = LinkCreatedResponse(response);
    if (linkResponse instanceof type.errors) return parseError(response);
    const domain = new URL(endpoint).origin;
    const url = `${domain}/c/${linkResponse.contents.token}`;
    return Ok({
      address: linkResponse.contents.address,
      url,
    });
  }

  async createToken(email: string, nonce: string, signature: string) {
    const endpoint = AuthEndpoints[this.network];
    const response = await this.http
      .post(`${endpoint}/create-token`, {
        json: { email, nonce: nonce, signature },
      })
      .json();
    const validatedResponse = TokenCreatedResponse(response);
    if (validatedResponse instanceof type.errors) return parseError(response);
    return Ok(validatedResponse);
  }

  async generate(
    target: { address: string; blockchain: string; token: string },
    amount: Decimal,
  ) {
    const endpoint = AddressEndpoints[this.network];
    const response = await this.http
      .post(`${endpoint}/generate`, {
        json: {
          source: {
            blockchain: "mynth",
            token: "usd",
          },
          target,
          amount: amount.toString(),
          providerId: "novaswap",
        },
      })
      .json();
    const validatedResponse = GenerateResponse(response);

    if (validatedResponse instanceof type.errors) return parseError(response);
    return Ok(validatedResponse);
  }

  private async sendViaAuth(authToken: string, amount: Decimal, to: string) {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http.post(`${endpoint}/transfer`, {
      headers: { Authorization: "Bearer " + authToken },
      json: {
        amount: amount.toString(),
        nonce: randomBytes(32).toString("hex"),
        to,
      },
    });
    if (response.status !== 200) return parseError(await response.json());
    return Ok();
  }

  private async sendViaKey(
    nonce: string,
    signature: string,
    amount: Decimal,
    to: string,
  ) {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http.post(`${endpoint}/transfer`, {
      json: {
        amount: amount.toString(),
        nonce,
        signature,
        to,
      },
    });
    if (response.status !== 200) return parseError(response.json());
    return Ok();
  }

  private async getAddressViaAddress(address: string) {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http
      .get(`${endpoint}/address`, {
        searchParams: { address },
      })
      .json();
    const validatedResponse = AddressResponse(response);
    if (validatedResponse instanceof type.errors) return parseError(response);
    return Ok(validatedResponse);
  }

  private async getAddressViaToken(token: string) {
    const endpoint = AccountsEndpoints[this.network];
    const response = await this.http
      .get(`${endpoint}/address`, {
        headers: { Authorization: "Bearer " + token },
      })
      .json();
    const validatedResponse = AddressResponse(response);
    if (validatedResponse instanceof type.errors) return parseError(response);
    return Ok(validatedResponse);
  }
}

const parseError = (data: unknown) => {
  const rateLimited = RateLimited(data);
  if (!(rateLimited instanceof type.errors)) {
    const seconds = rateLimited.contents.retryAfterSeconds;
    return Err(`Rate limited. Try again in ${seconds} seconds`);
  }

  const validationError = ValidationErrorResponse(data);
  if (validationError instanceof type.errors)
    return Err("Unknown " + JSON.stringify(data));

  return Err(
    validationError.contents.errors.map((error) => error.message).join("; "),
  );
};

const api = new NovaApiClient(getNetwork());

export { api };
