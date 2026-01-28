import {
  HttpTransport,
  InfoClient,
  ExchangeClient,
} from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";
import type { Config } from "../lib/config.js";
import type { Address, Hex } from "viem";

export interface CLIContext {
  config: Config;
  getPublicClient(): InfoClient;
  getWalletClient(): ExchangeClient;
  getWalletAddress(): Address;
}

export function createContext(config: Config): CLIContext {
  let publicClient: InfoClient | null = null;
  let walletClient: ExchangeClient | null = null;

  const transport = new HttpTransport({
    isTestnet: config.testnet,
  });

  return {
    config,

    getPublicClient(): InfoClient {
      if (!publicClient) {
        publicClient = new InfoClient({ transport });
      }
      return publicClient;
    },

    getWalletClient(): ExchangeClient {
      if (!walletClient) {
        if (!config.privateKey) {
          throw new Error(
            "HYPERLIQUID_PRIVATE_KEY environment variable is required for this command"
          );
        }
        const account = privateKeyToAccount(config.privateKey as Hex);
        walletClient = new ExchangeClient({ transport, wallet: account });
      }
      return walletClient;
    },

    getWalletAddress(): Address {
      if (config.walletAddress) {
        return config.walletAddress;
      }
      if (config.privateKey) {
        const account = privateKeyToAccount(config.privateKey as Hex);
        return account.address;
      }
      throw new Error(
        "HYPERLIQUID_PRIVATE_KEY or HYPERLIQUID_WALLET_ADDRESS environment variable is required"
      );
    },
  };
}
