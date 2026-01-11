/**
 * Jupiter Ultra Swap API Integration
 * Enhanced swap API with MEV protection and optimized execution
 * @see https://dev.jup.ag/docs/ultra
 */

const ULTRA_API_BASE = 'https://api.jup.ag/ultra/v1';

export interface UltraSwapOrder {
    requestId: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: 'ExactIn' | 'ExactOut';
    slippageBps: number;
    priceImpactPct: string;
    routePlan: UltraRoutePlan[];
    transaction: string; // Base64 encoded
    lastValidBlockHeight: number;
    prioritizationFeeLamports: number;
    computeUnitLimit: number;
    gasless: boolean;
}

export interface UltraRoutePlan {
    swapInfo: {
        ammKey: string;
        label: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        outAmount: string;
        feeAmount: string;
        feeMint: string;
    };
    percent: number;
}

export interface UltraExecuteResult {
    signature: string;
    status: 'Success' | 'Failed' | 'Expired';
    slot: number;
    confirmationTime: number;
    error?: string;
}

export interface UltraOrderParams {
    inputMint: string;
    outputMint: string;
    amount: string;
    slippageBps?: number;
    /** Referral fee account for earning integrator fees */
    platformFeeBps?: number;
    feeAccount?: string;
    /** Taker wallet address */
    taker: string;
}

/**
 * Ultra Swap Client - MEV-protected swaps with optimal execution
 * 
 * Features:
 * - Sub-second transaction landing
 * - MEV protection (sandwich attack resistant)
 * - Gasless swaps via Jupiter Z
 * - Real-time slippage estimation
 */
export class UltraSwapClient {
    private apiKey?: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }

    /**
     * Get a swap order with optimal routing
     */
    async getOrder(params: UltraOrderParams): Promise<UltraSwapOrder> {
        const queryParams = new URLSearchParams({
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: params.amount,
            slippageBps: String(params.slippageBps ?? 50),
            taker: params.taker,
        });

        if (params.platformFeeBps) {
            queryParams.set('platformFeeBps', String(params.platformFeeBps));
        }
        if (params.feeAccount) {
            queryParams.set('feeAccount', params.feeAccount);
        }

        const response = await fetch(
            `${ULTRA_API_BASE}/order?${queryParams}`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Ultra order failed: ${error.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Execute a swap order
     */
    async execute(
        order: UltraSwapOrder,
        signedTransaction: string
    ): Promise<UltraExecuteResult> {
        const response = await fetch(`${ULTRA_API_BASE}/execute`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                signedTransaction,
                requestId: order.requestId,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Ultra execute failed: ${error.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get order status by request ID
     */
    async getStatus(requestId: string): Promise<UltraExecuteResult> {
        const response = await fetch(
            `${ULTRA_API_BASE}/status?requestId=${requestId}`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.statusText}`);
        }

        return response.json();
    }
}

// Default client instance
export const ultraSwap = new UltraSwapClient();
