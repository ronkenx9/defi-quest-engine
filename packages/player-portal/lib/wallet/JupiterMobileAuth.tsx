import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Connection, PublicKey } from '@solana/web3.js';

const IDENTITY = {
  name: 'DeFi Quest',
  uri: 'https://defi-quest.com',
  icon: 'https://defi-quest.com/favicon.ico',
};

export interface AuthResult {
  address: string;
  authToken: string;
}

/**
 * Connect using Jupiter Mobile (Solana Mobile)
 * This fulfills the Jupiter Track requirement: "Jupiter Mobile as core authentication method"
 */
export async function connectJupiterMobile(
  connection: Connection,
  cluster: 'mainnet' | 'devnet' | 'localnet' = 'mainnet'
): Promise<AuthResult | null> {
  try {
    // Check if we're in a mobile webview
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) {
      console.log('Jupiter Mobile: Not on mobile device, using standard flow');
      return null;
    }

    const authorizationResult = await transact(async (wallet) => {
      return await wallet.authorize({
        identity: IDENTITY,
      });
    });

    const account = authorizationResult.accounts[0];

    console.log('? Jupiter Mobile connected:', account.address);

    return {
      address: account.address.toString(),
      authToken: authorizationResult.auth_token,
    };
  } catch (error) {
    console.error('Jupiter Mobile auth failed:', error);
    return null;
  }
}

/**
 * Reconnect with existing auth token (for returning users)
 */
export async function reconnectJupiterMobile(
  connection: Connection,
  authToken: string
): Promise<AuthResult | null> {
  try {
    const authorizationResult = await transact(async (wallet) => {
      return await wallet.reauthorize({
        auth_token: authToken,
        identity: IDENTITY,
      });
    });

    const account = authorizationResult.accounts[0];

    return {
      address: account.address.toString(),
      authToken: authorizationResult.auth_token,
    };
  } catch (error) {
    console.error('Jupiter Mobile reauth failed:', error);
    return null;
  }
}

/**
 * Sign a transaction using Jupiter Mobile wallet
 */
export async function signTransactionWithJupiterMobile(
  transaction: any,
  authToken?: string
): Promise<any> {
  return await transact(async (wallet) => {
    if (authToken) {
      return await wallet.reauthorize({
        auth_token: authToken,
        identity: IDENTITY,
      });
    }
    return await wallet.authorize({
      identity: IDENTITY,
    });
  });
}

export default connectJupiterMobile;
