export const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum Mainnet" },
  { id: 137, name: "Polygon Mainnet" },
  { id: 56, name: "BNB Smart Chain" },
  { id: 43114, name: "Avalanche C-Chain" },
  { id: 42161, name: "Arbitrum One" },
  { id: 10, name: "Optimism" },
  { id: 42220, name: "Celo" },
  { id: 480, name: "Worldchain" },
  { id: 8453, name: "Base" },
  { id: 534352, name: "Scroll" },
  { id: 59144, name: "Linea" },
  { id: 324, name: "zkSync" },
] as const;

export const SCHEMA_URLS = {
  v1: "https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/specs/erc7730-v1.schema.json",
  v2: "https://eips.ethereum.org/assets/eip-7730/erc7730-v2.schema.json",
} as const;
