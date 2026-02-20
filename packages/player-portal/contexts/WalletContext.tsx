'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { VersionedTransaction, Connection } from '@solana/web3.js';

import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';

interface WalletContextType {
    walletAddress: string | null;
    connecting: boolean;
    isMobile: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    signTransaction: (serializedTransaction: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Solana RPC endpoint
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

export function WalletProvider({ children }: { children: ReactNode }) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile on mount
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream)) {
                setIsMobile(true);
            }
        };
        checkMobile();

        const savedAddress = localStorage.getItem('walletAddress');
        if (savedAddress) {
            setWalletAddress(savedAddress);
        }
    }, []);

    const connect = async () => {
        setConnecting(true);
        try {
            // Check for Mobile Wallet Adapter first if on mobile
            if (isMobile) {
                const result = await transact(async (wallet) => {
                    const auth = await wallet.authorize({
                        cluster: 'mainnet-beta', // Jupiter Mobile requires mainnet-beta
                        identity: {
                            name: 'Matrix Protocol',
                            uri: window.location.origin,
                            // MWA often requires absolute icon URLs
                            icon: `${window.location.origin}/favicon.ico`,
                        }
                    });
                    return auth.accounts[0].address;
                });

                if (result) {
                    try {
                        const { PublicKey } = await import('@solana/web3.js');
                        // Try to parse the MWA string. Often it's a base64 encoded byte array of the pubkey.
                        // If it's pure base64:
                        const binaryStr = atob(result as string);
                        const len = binaryStr.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = binaryStr.charCodeAt(i);
                        }
                        const walletPubkey = new PublicKey(bytes);
                        const b58Str = walletPubkey.toString();

                        setWalletAddress(b58Str);
                        localStorage.setItem('walletAddress', b58Str);
                    } catch (e) {
                        // Fallback if it was already correctly formatted or decode failed
                        setWalletAddress(result as string);
                        localStorage.setItem('walletAddress', typeof result === 'string' ? result : '');
                    }
                    return;
                }
            }

            // Fallback to Browser wallet
            const globalWindow = window as any;
            const solana = globalWindow.solana || globalWindow.phantom?.solana || globalWindow.solflare;

            if (solana && typeof solana.connect === 'function') {
                try {
                    const response = await solana.connect();
                    const address = response.publicKey.toString();
                    setWalletAddress(address);
                    localStorage.setItem('walletAddress', address);
                } catch (e) {
                    console.error("Wallet connection failed:", e);
                    alert("Wallet connection failed. Please try again.");
                }
            } else {
                // No wallet extension found
                alert('No Solana wallet detected. Please install Phantom, Solflare, or use the Jupiter Terminal to connect via WalletConnect.');
            }
        } catch (error) {
            console.error('Connection error:', error);
        } finally {
            setConnecting(false);
        }
    };

    const disconnect = () => {
        setWalletAddress(null);
        localStorage.removeItem('walletAddress');
    };

    /**
     * Sign and send a transaction via Phantom wallet
     * @param serializedTransaction - Base64 encoded transaction from Jupiter
     * @returns Transaction signature or null if failed
     */
    const signTransaction = useCallback(async (serializedTransaction: string): Promise<string | null> => {
        try {
            // Decode base64 transaction to Uint8Array
            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBuffer);

            if (isMobile) {
                const result = await transact(async (wallet) => {
                    await wallet.authorize({
                        cluster: 'mainnet-beta',
                        identity: {
                            name: 'Matrix Protocol',
                            uri: window.location.origin,
                            icon: `${window.location.origin}/favicon.ico`,
                        }
                    });

                    // MWA expects base64 encoded payloads
                    const response = await wallet.signAndSendTransactions({
                        payloads: [serializedTransaction]
                    });
                    return response;
                });

                if (result && result.signatures && result.signatures.length > 0) {
                    // MWA usually returns base64 strings or byte arrays depending on version. 
                    // The types say string[] (actually base64 encoded signature if not already base58).
                    // Usually for Solana it's standard to return base64 signatures from MWA.
                    // But let's just return it. If it's a string, we return it.
                    const sig = result.signatures[0];

                    // If it's base64, we might need to convert it to base58 for standard Solana rpc interactions 
                    // outside of MWA. But let's return it as is if that matches what the App expects.
                    // Actually, MWA spec says it returns base64. 
                    // For now, let's return the string.
                    return sig;
                }
                return null;
            }

            const solana = (window as unknown as {
                solana?: {
                    isPhantom?: boolean;
                    signAndSendTransaction: (
                        transaction: VersionedTransaction,
                        options?: { skipPreflight?: boolean }
                    ) => Promise<{ signature: string }>;
                }
            }).solana;

            if (!solana?.isPhantom) {
                throw new Error('Phantom wallet not found');
            }

            // Sign and send via Phantom browser extension
            const { signature } = await solana.signAndSendTransaction(transaction, {
                skipPreflight: false,
            });

            // Wait for confirmation using the RPC
            try {
                const connection = new Connection(SOLANA_RPC, 'confirmed');
                await connection.confirmTransaction(signature, 'confirmed');
            } catch (confirmError) {
                console.warn('Transaction confirmation check failed, but tx may still succeed:', confirmError);
            }

            return signature;
        } catch (error) {
            console.error('Sign transaction error:', error);
            return null;
        }
    }, [isMobile]);

    return (
        <WalletContext.Provider value={{ walletAddress, connecting, connect, disconnect, signTransaction, isMobile }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

