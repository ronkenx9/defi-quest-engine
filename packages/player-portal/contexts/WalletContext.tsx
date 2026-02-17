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
                        cluster: 'mainnet-beta',
                        identity: {
                            name: 'Matrix Protocol',
                            uri: window.location.origin,
                            icon: 'favicon.ico',
                        }
                    });
                    return auth.accounts[0].address;
                });

                if (result) {
                    setWalletAddress(result);
                    localStorage.setItem('walletAddress', result);
                    return;
                }
            }

            // Fallback to Phantom/Browser wallet
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

