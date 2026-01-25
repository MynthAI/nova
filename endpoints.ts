const AuthEndpoints = {
  local: "http://127.0.0.1:3036/api/auth",
  testnet: "https://preview.mynth.ai/api/auth",
  mainnet: "https://www.mynth.ai/api/auth",
};

const Networks = Object.keys(AuthEndpoints);
type Network = keyof typeof AuthEndpoints;

const AccountsEndpoints: Record<Network, string> = {
  local: "http://127.0.0.1:3037/api/accounts",
  testnet: "https://preview.mynth.ai/api/accounts",
  mainnet: "https://www.mynth.ai/api/accounts",
};

const AddressEndpoints: Record<Network, string> = {
  local: "http://127.0.0.1:3015/api/address",
  testnet: "https://preview.mynth.ai/api/address",
  mainnet: "https://www.mynth.ai/api/address",
};

export { AccountsEndpoints, AddressEndpoints, AuthEndpoints, Networks };
export type { Network };
