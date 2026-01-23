'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { VersionedTransaction, Connection } from '@solana/web3.js';

interface WalletContextType {
    walletAddress: string | null;
    connecting: boolean;
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

    // Check for existing connection on mount
    useEffect(() => {
        const savedAddress = localStorage.getItem('walletAddress');
        if (savedAddress) {
            setWalletAddress(savedAddress);
        }

        // Also try to reconnect if Phantom is available
        const solana = (window as unknown as {
            solana?: { isPhantom?: boolean; isConnected?: boolean; publicKey?: { toString: () => string } }
        }).solana;

        if (solana?.isPhantom && solana.isConnected && solana.publicKey) {
            const address = solana.publicKey.toString();
            setWalletAddress(address);
            localStorage.setItem('walletAddress', address);
        }
    }, []);

    const connect = async () => {
        setConnecting(true);
        try {
            const solana = (window as unknown as {
                solana?: {
                    isPhantom?: boolean;
                    connect: () => Promise<{ publicKey: { toString: () => string } }>;
                }
            }).solana;

            if (solana?.isPhantom) {
                const response = await solana.connect();
                const address = response.publicKey.toString();
                setWalletAddress(address);
                localStorage.setItem('walletAddress', address);
            } else {
                // Fallback: prompt for manual address (for demo)
                const address = prompt('Enter your Solana wallet address:');
                if (address && address.length >= 32) {
                    setWalletAddress(address);
                    localStorage.setItem('walletAddress', address);
                }
            }
        } catch {
            // User rejected - silently ignore
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

            // Decode base64 transaction to Uint8Array
            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));

            // Deserialize into a VersionedTransaction (Jupiter returns versioned transactions)
            const transaction = VersionedTransaction.deserialize(transactionBuffer);

            // Sign and send via Phantom
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
    }, []);

    return (
        <WalletContext.Provider value={{ walletAddress, connecting, connect, disconnect, signTransaction }}>
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

