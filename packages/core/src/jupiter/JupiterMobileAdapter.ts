/**
 * DeFi Quest Engine - Jupiter Mobile Adapter
 * Provides proper integration with Jupiter Mobile wallet via Reown (WalletConnect)
 *
 * @see https://dev.jup.ag/tool-kits/wallet-kit/jupiter-mobile-adapter
 */

import { EventEmitter } from 'eventemitter3';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// ============================================================================
// Types
// ============================================================================

export interface JupiterMobileConfig {
    /** Reown Project ID from https://dashboard.reown.com/ */
    projectId: string;
    /** Solana network */
    network: 'mainnet-beta' | 'devnet' | 'testnet';
    /** Custom RPC URL (optional) */
    rpcUrl?: string;
    /** App metadata for WalletConnect */
    metadata?: {
        name: string;
        description: string;
        url: string;
        icons: string[];
    };
}

export interface MobileWalletState {
    address: string | null;
    publicKey: PublicKey | null;
    connected: boolean;
    isJupiterMobile: boolean;
    isMobileDevice: boolean;
}

export interface JupiterMobileEvents {
    'mobile:connecting': void;
    'mobile:connected': { state: MobileWalletState };
    'mobile:disconnected': void;
    'mobile:error': { error: Error };
    'mobile:accountChanged': { state: MobileWalletState };
    'mobile:uri': { uri: string }; // Emitted when WalletConnect URI is ready (for QR code)
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_METADATA = {
    name: 'DeFi Quest Engine',
    description: 'Gamified DeFi missions powered by Jupiter',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://defiquest.io',
    icons: ['https://defi-quest-home.netlify.app/favicon.svg'],
};

const RPC_URLS: Record<string, string> = {
    'mainnet-beta': 'https://api.mainnet-beta.solana.com',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
};

const CHAIN_IDS: Record<string, string> = {
    'mainnet-beta': '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    'devnet': 'EtWTRSppJ7qgguUmsvUQCSR8hmshYm17SUt8GvKAtPry',
    'testnet': '4uhcH4gBV2nbJTM3GyL6qD4Qd2MKrq6P4mXhMwCJX9n6',
};

const RELAY_URLS = [
    'wss://relay.walletconnect.com',
    'wss://0.relay.walletconnect.com',
    'wss://1.relay.walletconnect.com'
];

// ============================================================================
// Jupiter Mobile Adapter
// ============================================================================

/**
 * Jupiter Mobile Adapter
 *
 * Handles wallet connection via Jupiter Mobile using WalletConnect/Reown protocol.
 * This allows users on mobile devices to connect their Jupiter Mobile wallet
 * to web dApps seamlessly.
 *
 * @example
 * ```typescript
 * const adapter = new JupiterMobileAdapter({
 *   projectId: 'your-reown-project-id',
 *   network: 'devnet',
 * });
 *
 * await adapter.initialize();
 * const state = await adapter.connect();
 * console.log('Connected:', state.address);
 * ```
 */
export class JupiterMobileAdapter extends EventEmitter<JupiterMobileEvents> {
    private config: Required<JupiterMobileConfig>;
    private connection: Connection | null = null;
    private state: MobileWalletState = {
        address: null,
        publicKey: null,
        connected: false,
        isJupiterMobile: false,
        isMobileDevice: false,
    };
    private signClient: any = null;
    private session: any = null;

    constructor(config: JupiterMobileConfig) {
        super();
        this.config = {
            ...config,
            projectId: config.projectId || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_REOWN_PROJECT_ID : '') || '',
            rpcUrl: config.rpcUrl || RPC_URLS[config.network] || RPC_URLS['mainnet-beta'],
            metadata: config.metadata || DEFAULT_METADATA,
        };
        this.state.isMobileDevice = this.detectMobile();
    }

    /**
     * Update internal state and sync publicKey
     */
    private updateState(updates: Partial<MobileWalletState>): void {
        this.state = { ...this.state, ...updates };
        if (updates.address) {
            this.state.publicKey = new PublicKey(updates.address);
        }
    }

    /**
     * Detect if running on a mobile device
     */
    private detectMobile(): boolean {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            return false;
        }

        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    /**
     * Initialize the adapter and Solana connection
     */
    async initialize(): Promise<void> {
        // Create Solana connection
        this.connection = new Connection(this.config.rpcUrl, 'confirmed');

        // Log initialization for debugging
        console.log('[JupiterMobileAdapter] Initialized', {
            network: this.config.network,
            isMobile: this.state.isMobileDevice,
            projectId: this.config.projectId.substring(0, 8) + '...',
        });

        // Check if we have a stored session to auto-reconnect
        await this.checkExistingSession();
    }

    /**
     * Check for existing WalletConnect session
     */
    private async checkExistingSession(): Promise<void> {
        const storedSession = typeof window !== 'undefined'
            ? localStorage.getItem('defi-quest-wallet-session')
            : null;

        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                if (session.address && session.expiresAt > Date.now()) {
                    console.log('[JupiterMobileAdapter] Restoring session for', session.address);
                }
            } catch (e) {
                localStorage.removeItem('defi-quest-wallet-session');
            }
        }
    }

    /**
     * Get the Solana connection
     */
    getConnection(): Connection | null {
        return this.connection;
    }

    /**
     * Get current wallet state
     */
    getState(): MobileWalletState {
        return { ...this.state };
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.state.connected;
    }

    /**
     * Check if running on mobile
     */
    isMobile(): boolean {
        return this.state.isMobileDevice;
    }

    /**
     * Check if using Jupiter Mobile
     */
    isJupiterMobileWallet(): boolean {
        return this.state.isJupiterMobile;
    }

    /**
     * Get WalletConnect URI for QR code generation
     * This initializes the SignClient and returns the pairing URI
     */
    async getConnectionUri(): Promise<string> {
        // Dynamically import WalletConnect SignClient
        let SignClient: any;
        try {
            const mod = await import('@walletconnect/sign-client');
            SignClient = mod.SignClient || mod.default;
        } catch {
            throw new Error('@walletconnect/sign-client not installed');
        }

        // Initialize the WalletConnect SignClient with relay fallbacks
        let lastError: any;
        for (const relayUrl of RELAY_URLS) {
            try {
                console.log(`[JupiterMobileAdapter] Attempting SignClient init with relay: ${relayUrl}`);
                this.signClient = await SignClient.init({
                    projectId: this.config.projectId,
                    relayUrl,
                    logger: 'debug',
                    metadata: {
                        name: this.config.metadata.name,
                        description: this.config.metadata.description,
                        url: this.config.metadata.url,
                        icons: this.config.metadata.icons,
                    },
                });
                console.log(`[JupiterMobileAdapter] SignClient initialized successfully with: ${relayUrl}`);
                break; // Success!
            } catch (err) {
                console.warn(`[JupiterMobileAdapter] Failed to init SignClient with relay ${relayUrl}:`, err);
                lastError = err;
            }
        }

        if (!this.signClient) {
            throw lastError || new Error('Failed to initialize WalletConnect SignClient with any relay');
        }

        // Generate a pairing proposal for Solana using optionalNamespaces (recommended for newer WC v2)
        const { uri } = await this.signClient.connect({
            optionalNamespaces: {
                solana: {
                    methods: [
                        'solana_signTransaction',
                        'solana_signMessage',
                    ],
                    chains: [`solana:${CHAIN_IDS[this.config.network]}`],
                    events: ['accountChanged'],
                },
            },
        });

        if (!uri) {
            throw new Error('Failed to generate WalletConnect URI');
        }

        // Emit the URI event for QR code generation
        this.emit('mobile:uri', { uri });

        return uri;
    }

    /**
     * Wait for wallet approval and complete connection
     * Call this after user scans QR code or opens deep link
     */
    async completeConnection(): Promise<MobileWalletState> {
        if (!this.signClient) {
            throw new Error('SignClient not initialized. Call getConnectionUri() first.');
        }

        try {
            // Wait for the user to approve in Jupiter Mobile
            const { approval } = await this.signClient.connect({
                optionalNamespaces: {
                    solana: {
                        methods: ['solana_signTransaction', 'solana_signMessage'],
                        chains: [`solana:${CHAIN_IDS[this.config.network]}`],
                        events: ['accountChanged'],
                    },
                },
            });

            this.session = await approval();

            // Extract the wallet address from the approved session as requested
            // Format is "solana:mainnet:ADDRESS"
            const solanaAccounts = this.session.namespaces?.solana?.accounts || [];
            const firstAccount = solanaAccounts[0];
            const address = firstAccount ? firstAccount.split(':')[2] || null : null;

            if (!address) {
                throw new Error('No Solana account returned from Jupiter Mobile session');
            }

            this.state = {
                address,
                publicKey: new PublicKey(address),
                connected: true,
                isJupiterMobile: true,
                isMobileDevice: this.state.isMobileDevice,
            };

            // Store the session for future use
            this.storeSession();

            // Set up event listeners
            this.setupSessionListeners();

            this.emit('mobile:connected', { state: this.state });
            console.log('[JupiterMobileAdapter] Connected via Jupiter Mobile:', address.slice(0, 8) + '...');

            return this.state;
        } catch (error: any) {
            console.error('[JupiterMobileAdapter] Connection failed:', error);
            this.emit('mobile:error', { error });
            throw error;
        }
    }

    /**
     * Set up session event listeners
     */
    private setupSessionListeners(): void {
        if (!this.signClient) return;

        this.signClient.on('session_update', ({ params }: any) => {
            const updatedAccounts = params?.namespaces?.solana?.accounts || [];
            const updatedAddress = updatedAccounts[0]?.split(':')[2] || null;
            if (updatedAddress && updatedAddress !== this.state.address) {
                this.updateState({ address: updatedAddress });
                this.emit('mobile:accountChanged', { state: this.getState() });
            }
        });

        // Add session_event listener as requested
        this.signClient.on('session_event', ({ params }: any) => {
            console.log('[JupiterMobileAdapter] Session event:', params);
            const accounts = params?.namespaces?.solana?.accounts || [];
            const address = accounts[0]?.split(':')[2] || null;
            if (address && address !== this.state.address) {
                this.updateState({ address });
                this.emit('mobile:accountChanged', { state: this.getState() });
            }
        });

        this.signClient.on('session_delete', () => {
            this.handleDisconnect();
        });
    }

    /**
     * Connect to wallet
     *
     * On mobile: Opens Jupiter Mobile app via deep link
     * On desktop: Returns the connection state (use getConnectionUri for QR)
     */
    async connect(): Promise<MobileWalletState> {
        this.emit('mobile:connecting');

        try {
            if (this.state.isMobileDevice) {
                return await this.connectMobile();
            } else {
                return await this.connectDesktop();
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Connection failed');
            this.emit('mobile:error', { error: err });
            throw err;
        }
    }

    /**
     * Connect via Jupiter Mobile (WalletConnect)
     */
    private async connectMobile(): Promise<MobileWalletState> {
        console.log('[JupiterMobileAdapter] Connecting via Jupiter Mobile...');
        this.emit('mobile:connecting');

        try {
            // Get the connection URI
            const uri = await this.getConnectionUri();

            // Open Jupiter Mobile via deep link
            const deepLink = `jup://wc?uri=${encodeURIComponent(uri)}`;
            console.log('[JupiterMobileAdapter] Opening Jupiter Mobile deep link');

            if (typeof window !== 'undefined') {
                window.location.href = deepLink;
            }

            // Wait for the user to approve and complete connection
            return await this.completeConnection();
        } catch (error: any) {
            console.error('[JupiterMobileAdapter] Mobile connection failed:', error);
            this.emit('mobile:error', { error });

            // Graceful fallback: try desktop connection
            console.log('[JupiterMobileAdapter] Falling back to desktop connection');
            return await this.connectDesktop();
        }
    }

    /**
     * Connect via desktop browser wallet (Phantom, Solflare, etc.)
     */
    private async connectDesktop(): Promise<MobileWalletState> {
        console.log('[JupiterMobileAdapter] Connecting via browser wallet...');

        const provider = this.getBrowserProvider();

        if (!provider) {
            const error = new Error(
                this.state.isMobileDevice
                    ? 'Please install Jupiter Mobile from the App Store or Play Store'
                    : 'Please install a Solana wallet (Phantom, Solflare, or Backpack)'
            );
            throw error;
        }

        const response = await provider.connect();
        const publicKey = new PublicKey(response.publicKey.toString());

        this.state = {
            address: publicKey.toString(),
            publicKey,
            connected: true,
            isJupiterMobile: false,
            isMobileDevice: this.state.isMobileDevice,
        };

        this.storeSession();
        this.setupProviderListeners(provider);

        this.emit('mobile:connected', { state: this.state });
        return this.state;
    }

    /**
     * Get browser wallet provider
     */
    private getBrowserProvider(): any {
        if (typeof window === 'undefined') return null;

        const win = window as any;

        if (win.phantom?.solana?.isPhantom) {
            return win.phantom.solana;
        }

        if (win.solflare?.isSolflare) {
            return win.solflare;
        }

        if (win.backpack?.isBackpack) {
            return win.backpack;
        }

        if (win.solana) {
            return win.solana;
        }

        return null;
    }

    /**
     * Set up provider event listeners
     */
    private setupProviderListeners(provider: any): void {
        provider.on('disconnect', () => {
            this.handleDisconnect();
        });

        provider.on('accountChanged', (newPublicKey: PublicKey | null) => {
            if (newPublicKey) {
                this.state = {
                    ...this.state,
                    address: newPublicKey.toString(),
                    publicKey: newPublicKey,
                };
                this.storeSession();
                this.emit('mobile:accountChanged', { state: this.state });
            } else {
                this.handleDisconnect();
            }
        });
    }

    /**
     * Store session for auto-reconnect
     */
    private storeSession(): void {
        if (typeof window === 'undefined' || !this.state.address) return;

        const session = {
            address: this.state.address,
            isJupiterMobile: this.state.isJupiterMobile,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };

        localStorage.setItem('defi-quest-wallet-session', JSON.stringify(session));
    }

    /**
     * Handle disconnect
     */
    private handleDisconnect(): void {
        this.state = {
            address: null,
            publicKey: null,
            connected: false,
            isJupiterMobile: false,
            isMobileDevice: this.state.isMobileDevice,
        };

        if (typeof window !== 'undefined') {
            localStorage.removeItem('defi-quest-wallet-session');
        }

        this.emit('mobile:disconnected');
    }

    /**
     * Disconnect wallet
     */
    async disconnect(): Promise<void> {
        try {
            // Disconnect WalletConnect session if active
            if (this.signClient && this.session) {
                await this.signClient.disconnect({
                    topic: this.session.topic,
                });
            }

            // Disconnect browser wallet if active
            const provider = this.getBrowserProvider();
            if (provider && provider.disconnect) {
                await provider.disconnect();
            }
        } catch (error) {
            console.error('[JupiterMobileAdapter] Disconnect error:', error);
        } finally {
            this.handleDisconnect();
        }
    }

    /**
     * Sign and send transaction
     */
    async signAndSendTransaction(
        transaction: Transaction | VersionedTransaction
    ): Promise<string> {
        // Use WalletConnect for Jupiter Mobile
        if (this.signClient && this.session && this.state.isJupiterMobile) {
            return await this.signWithWalletConnect(transaction);
        }

        // Use browser wallet
        const provider = this.getBrowserProvider();

        if (!provider || !this.state.connected) {
            throw new Error('Wallet not connected');
        }

        if (!this.connection) {
            throw new Error('Connection not initialized');
        }

        try {
            const signedTx = await provider.signTransaction(transaction);

            const signature = await this.connection.sendRawTransaction(
                signedTx.serialize(),
                { skipPreflight: false, preflightCommitment: 'confirmed' }
            );

            const latestBlockhash = await this.connection.getLatestBlockhash();
            await this.connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            }, 'confirmed');

            return signature;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Transaction failed');
            this.emit('mobile:error', { error: err });
            throw err;
        }
    }

    /**
     * Sign transaction using WalletConnect
     */
    private async signWithWalletConnect(transaction: Transaction | VersionedTransaction): Promise<string> {
        if (!this.signClient || !this.session || !this.connection) {
            throw new Error('WalletConnect not initialized');
        }

        try {
            // Get the recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();

            // Prepare transaction
            if ('message' in transaction) {
                // VersionedTransaction
                transaction.message.recentBlockhash = blockhash;
            } else {
                // Legacy Transaction
                transaction.recentBlockhash = blockhash;
            }

            // Request signature from wallet
            const response = await this.signClient.request({
                topic: this.session.topic,
                chainId: `solana:${CHAIN_IDS[this.config.network]}`,
                request: {
                    method: 'solana_signTransaction',
                    params: {
                        transaction: Buffer.from(transaction.serialize()).toString('base64'),
                    },
                },
            });

            // Deserialize the signed transaction
            const signedTx = VersionedTransaction.deserialize(
                Buffer.from(response.signature, 'base64')
            );

            // Send the transaction
            const signature = await this.connection.sendRawTransaction(
                signedTx.serialize(),
                { skipPreflight: false, preflightCommitment: 'confirmed' }
            );

            // Wait for confirmation
            await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight: await this.connection.getBlockHeight(),
            }, 'confirmed');

            return signature;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('WalletConnect transaction failed');
            this.emit('mobile:error', { error: err });
            throw err;
        }
    }

    /**
     * Sign a message
     */
    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        // Use WalletConnect for Jupiter Mobile
        if (this.signClient && this.session && this.state.isJupiterMobile) {
            if (!this.signClient) {
                throw new Error('WalletConnect not initialized');
            }

            const response = await this.signClient.request({
                topic: this.session.topic,
                chainId: `solana:${CHAIN_IDS[this.config.network]}`,
                request: {
                    method: 'solana_signMessage',
                    params: {
                        message: Buffer.from(message).toString('base64'),
                    },
                },
            });

            return Uint8Array.from(Buffer.from(response.signature, 'base64'));
        }

        // Use browser wallet
        const provider = this.getBrowserProvider();

        if (!provider || !this.state.connected) {
            throw new Error('Wallet not connected');
        }

        try {
            const { signature } = await provider.signMessage(message, 'utf8');
            return signature;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Message signing failed');
            this.emit('mobile:error', { error: err });
            throw err;
        }
    }

    /**
     * Get Jupiter Mobile download links
     */
    static getDownloadLinks(): { ios: string; android: string; web: string } {
        return {
            ios: 'https://apps.apple.com/us/app/jupiter-mobile/id6484069059',
            android: 'https://play.google.com/store/apps/details?id=ag.jup.jupiter.android',
            web: 'https://jup.ag/mobile',
        };
    }
}
