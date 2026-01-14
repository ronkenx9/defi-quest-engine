'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
    walletAddress: string | null;
    connecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

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

    return (
        <WalletContext.Provider value={{ walletAddress, connecting, connect, disconnect }}>
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
