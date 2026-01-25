import type { Network } from "./endpoints";

const stablecoins = {
  mainnet: {
    base: {
      USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    cardano: {
      USDA: "fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae45655534441",
      USDC: "25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff93555534443",
      USDM: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d",
    },
    hyperliquid: {
      USDC: "USDC:0x6d1e7cde53ba9467b783cb7c530ce054",
    },
    solana: {
      USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    },
    stable: {
      USDT: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
    },
    sui: {
      USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    },
    tron: {
      USDT: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    },
  },
  preview: {
    base: {
      USDC: "0x7D8Fa6A1c14f9cCb5D61747d4D7a590005c13b16",
    },
    cardano: {
      USDA: "3520398f427dd581eaa74439e63dd2034788f0a73f2e97522e3aaccb55534441",
      USDC: "9d269c864e7adfeeda6b54d6c792a2d5a6881f75bfb4a37364c7d54a69555344",
      USDM: "ba44861dfd9cd0909073185366db41bc8f91ddd08a700bc2609127f15553444d",
    },
    hyperliquid: {
      USDC: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
    },
    solana: {
      USDC: "3h2KKhmNPdPo8zsytmbMhGj6oDA1TCdEUKzSYg2q12MA",
    },
    stable: {
      USDT: "0x78Cf24370174180738C5B8E352B6D14c83a6c9A9",
    },
    sui: {
      USDT: "0x41703e1027f2f2172769e88d369fa917e9a5ed839687b33996466cf629ed46e5::tdsu::TDSU",
    },
    tron: {
      USDT: "TKWgY8QLishTDCAECcKKyUmkkyE9eS9nVc",
    },
  },
};

const resolveStablecoin = (
  stablecoin: string,
  blockchain: string,
  network: Network,
) => {
  const stablecoinNetwork: "mainnet" | "preview" =
    network === "mainnet" ? "mainnet" : "preview";
  const blockchains = stablecoins[stablecoinNetwork];
  if (!(blockchain in blockchains)) return;

  const blockchainStablecoins = blockchains[blockchain as "cardano"];
  if (!(stablecoin in blockchainStablecoins)) return;

  return blockchainStablecoins[stablecoin as "USDA"];
};

export default resolveStablecoin;
