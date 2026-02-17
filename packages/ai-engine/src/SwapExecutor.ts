import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { createJupiterApiClient } from '@jup-ag/api';

// Common token mint addresses on Solana
const TOKEN_MINTS: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSFqM7BcEjHw5n5k9C4RZD4K5Z6D3a9',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11Mcx8eKs1dish',
  'WIF': '85VBFQZC9TZkfaptBWqv14ALD9fJNUKtWA41kh69teRP',
  'BONK': 'DezXAZ8z7Pnrnz8riM9q5ZLTc2fZ9TMPc5eN5RYxYD7',
  'POPCAT': '7UVimHwR9vqZ3u44qWxY3KPLL6dN7KfNpR4i4w1aS3p',
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtkqjberbSOWd91pbT2',
};

export interface SwapParams {
  inputToken: string;
  outputToken: string;
  amount: number; // in SOL
  slippageBps?: number;
}

export interface SwapResult {
  signature: string;
  success: boolean;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
}

/**
 * Swap Executor - Executes real swaps via Jupiter API
 */
export class SwapExecutor {
  private connection: Connection;
  private jupiter: ReturnType<typeof createJupiterApiClient>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.jupiter = createJupiterApiClient();
  }

  /**
   * Resolve token symbol to mint address
   */
  private resolveTokenMint(token: string): string {
    return TOKEN_MINTS[token.toUpperCase()] || token;
  }

  /**
   * Get a quote from Jupiter
   */
  async getQuote(params: SwapParams): Promise<any> {
    const inputMint = this.resolveTokenMint(params.inputToken);
    const outputMint = this.resolveTokenMint(params.outputToken);
    const amountInLamports = Math.floor(params.amount * 1e9);

    const quote = await this.jupiter.quoteGet({
      inputMint,
      outputMint,
      amount: amountInLamports,
      slippageBps: params.slippageBps || 50,
    });

    if (!quote) {
      throw new Error('No quote available for this swap pair');
    }

    return quote;
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    quote: any,
    userKeypair: Keypair
  ): Promise<SwapResult> {
    try {
      // Get swap transaction from Jupiter
      const { swapTransaction } = await this.jupiter.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: userKeypair.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 0, // Use default priority fee
        } as any,
      });

      // Deserialize the transaction
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(swapTransaction, 'base64')
      );

      // Sign and send the transaction
      transaction.sign([userKeypair]);

      const signature = await this.connection.sendTransaction(transaction, {
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        signature,
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      return {
        signature,
        success: true,
        inputAmount: Number(quote.inAmount) / 1e9,
        outputAmount: Number(quote.outAmount) / 1e9,
        priceImpact: Number(quote.priceImpactPct) || 0,
      };
    } catch (error) {
      console.error('Swap execution failed:', error);
      return {
        signature: '',
        success: false,
        inputAmount: 0,
        outputAmount: 0,
        priceImpact: 0,
      };
    }
  }

  /**
   * Full swap: get quote + execute
   */
  async swap(
    params: SwapParams,
    userKeypair: Keypair
  ): Promise<SwapResult> {
    const quote = await this.getQuote(params);
    return this.executeSwap(quote, userKeypair);
  }
}
