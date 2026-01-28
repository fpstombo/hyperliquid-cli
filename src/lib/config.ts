import { privateKeyToAccount } from "viem/accounts";
import type { Hex, Address } from "viem";

export interface Config {
  privateKey?: Hex;
  walletAddress?: Address;
  testnet: boolean;
}

export function loadConfig(testnet: boolean): Config {
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY as Hex | undefined;
  let walletAddress = process.env.HYPERLIQUID_WALLET_ADDRESS as
    | Address
    | undefined;

  if (privateKey && !walletAddress) {
    const account = privateKeyToAccount(privateKey);
    walletAddress = account.address;
  }

  return {
    privateKey,
    walletAddress,
    testnet,
  };
}
