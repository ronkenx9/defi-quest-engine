/**
 * DeFi Quest Engine - Jupiter Wallet Connection
 * Handles wallet connection via Jupiter Mobile adapter
 */

import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { EventEmitter } from 'eventemitter3';

export interface WalletInfo {
    address: string;
    publicKey: PublicKey;
    connected: boolean;
    isJupiterMobile: boolean;
}

export interface WalletEvents {
    'wallet:connected': { wallet: WalletInfo };
    'wallet:disconnected': { address: string };
    'wallet:error': { error: Error };
    'wallet:accountChanged': { wallet: WalletInfo };
}

export interface WalletConfig {
    reownProjectId: string;
    network: 'mainnet-beta' | 'devnet' | 'testnet';
    rpcUrl?: string;
    appMetadata?: {
        name: string;
        description: string;
        url: string;
        icons: string[];
    };
}

const DEFAULT_APP_METADATA = {
    name: 'DeFi Quest Engine',
    description: 'Gamified DeFi missions on Solana',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://defiquest.io',
    icons: ['https://defiquest.io/icon.png'],
};

export class WalletConnector extends EventEmitter<WalletEvents> {
    private config: WalletConfig;
    private connection: Connection | null = null;
    private currentWallet: WalletInfo | null = null;
    private adapter: any = null; // Will be typed when Jupiter adapter is loaded

    constructor(config: WalletConfig) {
        super();
        this.config = {
            ...config,
            appMetadata: config.appMetadata || DEFAULT_APP_METADATA,
        };
    }

    async initialize(): Promise<void> {
        // Validation for Reown Project ID
        if (!this.config.reownProjectId) {
            console.error('[WalletConnector] Missing Reown Project ID! WebSocket connection will fail.');
        } else if (!/^[0-9a-f]{32}$/i.test(this.config.reownProjectId)) {
            console.warn(`[WalletConnector] Invalid Reown Project ID format: "${this.config.reownProjectId}". Expected a 32-character hex string.`);
        }

        // Set up Solana connection
        const rpcUrl = this.config.rpcUrl || this.getDefaultRpcUrl();
        this.connection = new Connection(rpcUrl, 'confirmed');

        // Note: In production, you would dynamically import the Jupiter adapter
        // import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';
        // For now, we'll use a mock that works with standard wallet adapters
        console.log('[WalletConnector] Initialized with Reown Project ID:', this.config.reownProjectId);
    }

    /**
     * Get default RPC URL based on network
     */
    private getDefaultRpcUrl(): string {
        switch (this.config.network) {
            case 'mainnet-beta':
                return 'https://api.mainnet-beta.solana.com';
            case 'testnet':
                return 'https://api.testnet.solana.com';
            case 'devnet':
            default:
                return 'https://api.devnet.solana.com';
        }
    }

    /**
     * Get current connection
     */
    getConnection(): Connection | null {
        return this.connection;
    }

    /**
     * Check if wallet is connected
     */
    isConnected(): boolean {
        return this.currentWallet?.connected ?? false;
    }

    /**
     * Get current wallet info
     */
    getWallet(): WalletInfo | null {
        return this.currentWallet;
    }

    /**
     * Manually set the wallet info (for external connections)
     */
    setWallet(wallet: WalletInfo | null): void {
        this.currentWallet = wallet;
        if (wallet) {
            this.emit('wallet:connected', { wallet });
        } else {
            this.emit('wallet:disconnected', { address: '' });
        }
    }

    /**
     * Get wallet address
     */
    getAddress(): string | null {
        return this.currentWallet?.address ?? null;
    }

    /**
     * Get public key
     */
    getPublicKey(): PublicKey | null {
        return this.currentWallet?.publicKey ?? null;
    }

    /**
     * Connect to wallet
     * In a real implementation, this would use the Jupiter Mobile adapter
     */
    async connect(): Promise<WalletInfo | null> {
        try {
            // Check for Phantom or other Solana wallets
            const provider = this.getProvider();

            if (!provider) {
                throw new Error('No Solana wallet found. Please install Phantom or connect via Jupiter Mobile.');
            }

            // Request connection
            const response = await provider.connect();
            const publicKey = new PublicKey(response.publicKey.toString());

            this.currentWallet = {
                address: publicKey.toString(),
                publicKey,
                connected: true,
                isJupiterMobile: false, // Would be true for Jupiter Mobile connections
            };

            // Set up disconnect listener
            provider.on('disconnect', () => {
                this.handleDisconnect();
            });

            // Set up account change listener
            provider.on('accountChanged', (newPublicKey: PublicKey | null) => {
                if (newPublicKey) {
                    this.currentWallet = {
                        address: newPublicKey.toString(),
                        publicKey: newPublicKey,
                        connected: true,
                        isJupiterMobile: false,
                    };
                    this.emit('wallet:accountChanged', { wallet: this.currentWallet });
                } else {
                    this.handleDisconnect();
                }
            });

            this.emit('wallet:connected', { wallet: this.currentWallet });
            return this.currentWallet;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Connection failed');
            this.emit('wallet:error', { error: err });
            throw err;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect(): Promise<void> {
        try {
            const provider = this.getProvider();
            if (provider) {
                await provider.disconnect();
            }
            this.handleDisconnect();
        } catch (error) {
            console.error('Disconnect error:', error);
            this.handleDisconnect();
        }
    }

    /**
     * Handle disconnect event
     */
    private handleDisconnect(): void {
        const address = this.currentWallet?.address || '';
        this.currentWallet = null;
        this.emit('wallet:disconnected', { address });
    }

    /**
     * Get the wallet provider (Phantom, etc.)
     */
    private getProvider(): any {
        if (typeof window === 'undefined') return null;

        // Check for Phantom
        if ('phantom' in window) {
            const phantom = (window as any).phantom;
            if (phantom?.solana?.isPhantom) {
                return phantom.solana;
            }
        }

        // Check for Solflare
        if ('solflare' in window) {
            const solflare = (window as any).solflare;
            if (solflare?.isSolflare) {
                return solflare;
            }
        }

        // Check for generic Solana provider
        if ('solana' in window) {
            return (window as any).solana;
        }

        return null;
    }

    /**
     * Sign and send a transaction
     */
    async signAndSendTransaction(
        transaction: Transaction | VersionedTransaction
    ): Promise<string> {
        const provider = this.getProvider();
        if (!provider || !this.currentWallet) {
            throw new Error('Wallet not connected');
        }

        if (!this.connection) {
            throw new Error('Connection not initialized');
        }

        try {
            // Sign transaction
            const signedTransaction = await provider.signTransaction(transaction);

            // Send transaction
            const signature = await this.connection.sendRawTransaction(
                signedTransaction.serialize(),
                { skipPreflight: false }
            );

            // Wait for confirmation
            await this.connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Transaction failed');
            this.emit('wallet:error', { error: err });
            throw err;
        }
    }

    /**
     * Sign a message
     */
    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        const provider = this.getProvider();
        if (!provider || !this.currentWallet) {
            throw new Error('Wallet not connected');
        }

        try {
            const { signature } = await provider.signMessage(message, 'utf8');
            return signature;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Message signing failed');
            this.emit('wallet:error', { error: err });
            throw err;
        }
    }

    /**
     * Get recent transactions for the connected wallet
     */
    async getRecentTransactions(limit: number = 10): Promise<string[]> {
        if (!this.connection || !this.currentWallet) {
            return [];
        }

        try {
            const signatures = await this.connection.getSignaturesForAddress(
                this.currentWallet.publicKey,
                { limit }
            );
            return signatures.map((s) => s.signature);
        } catch (error) {
            console.error('Failed to get recent transactions:', error);
            return [];
        }
    }

    /**
     * Get SOL balance
     */
    async getBalance(): Promise<number> {
        if (!this.connection || !this.currentWallet) {
            return 0;
        }

        try {
            const balance = await this.connection.getBalance(this.currentWallet.publicKey);
            return balance / 1e9; // Convert lamports to SOL
        } catch (error) {
            console.error('Failed to get balance:', error);
            return 0;
        }
    }
}
