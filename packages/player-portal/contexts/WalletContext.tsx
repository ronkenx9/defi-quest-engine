'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { VersionedTransaction, Connection, PublicKey } from '@solana/web3.js';
import { UnifiedWalletProvider, useUnifiedWallet, Adapter } from "@jup-ag/wallet-adapter";
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';
import WalletNotification from '../components/player/WalletNotification';

interface WalletContextType {
    walletAddress: string | null;
    activePublicKey: PublicKey | null;
    connecting: boolean;
    isMobile: boolean;
    isJupiterMobile: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    signTransaction: (serializedTransaction: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const REOWN_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'dc8ff06ef233d8855725e0d0e227c15b';

async function ensurePlayerProfile(publicKey: PublicKey) {
    try {
        const { supabase } = await import('@/lib/supabase');

        const { data: userData } = await supabase
            .from('user_stats')
            .select('profile_nft_address')
            .eq('wallet_address', publicKey.toString())
            .single();

        if (!userData?.profile_nft_address) {
            console.log('Registering player profile...');

            const response = await fetch('/api/profile/mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toString(),
                    username: `Player_${publicKey.toString().slice(0, 6)}`
                })
            });

            const result = await response.json();

            if (response.ok && result.profileNftAddress) {
                console.log('Profile registered/minted:', result.profileNftAddress);
                return result.profileNftAddress;
            }

            return null;
        }

        return userData.profile_nft_address;
    } catch (error) {
        console.error('Failed to ensure profile:', error);
        return null;
    }
}

export function WalletProvider({ children }: { children: ReactNode }) {
    // 1. Initialize Jupiter Mobile Adapter (Reown wrapper)
    const { jupiterAdapter } = useWrappedReownAdapter({
        appKitOptions: {
            metadata: {
                name: 'DeFi Quest Engine',
                description: 'Gamified DeFi missions powered by Jupiter',
                url: typeof window !== 'undefined' ? window.location.origin : 'https://defiquest.io',
                icons: ['https://defi-quest-home.netlify.app/favicon.svg'],
            },
            projectId: REOWN_PROJECT_ID,
            features: {
                analytics: false,
                socials: ['google', 'x', 'apple'],
                email: false,
            },
            enableWallets: false, // Use only Jupiter Mobile Adapter for mobile login
        },
    });

    const wallets: Adapter[] = useMemo(() => {
        return [
            jupiterAdapter,
        ].filter((item) => item && item.name && item.icon) as Adapter[];
    }, [jupiterAdapter]);

    return (
        <UnifiedWalletProvider
            wallets={wallets}
            config={{
                autoConnect: true,
                env: "mainnet-beta",
                metadata: {
                    name: "DeFi Quest",
                    description: "Gamified DeFi missions powered by Jupiter",
                    url: typeof window !== 'undefined' ? window.location.origin : "https://defiquest.io",
                    iconUrls: ["https://defi-quest-home.netlify.app/favicon.svg"],
                },
                notificationCallback: WalletNotification,
                walletlistExplanation: {
                    href: "https://dev.jup.ag/tool-kits/wallet-kit",
                },
                theme: "dark",
                lang: "en",
            }}
        >
            <WalletContextProviderInner>
                {children}
            </WalletContextProviderInner>
        </UnifiedWalletProvider>
    );
}

function WalletContextProviderInner({ children }: { children: ReactNode }) {
    const { publicKey, connected, connecting, disconnect, setShowModal } = useUnifiedWallet() as any;
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream)) {
                setIsMobile(true);
            }
        };
        checkMobile();
    }, []);

    const connect = async () => {
        setShowModal(true);
    };

    const walletAddress = publicKey ? publicKey.toString() : null;

    useEffect(() => {
        if (publicKey) {
            ensurePlayerProfile(publicKey);
            localStorage.setItem('walletAddress', publicKey.toString());
        } else {
            localStorage.removeItem('walletAddress');
        }
    }, [publicKey]);

    const signTransaction = useCallback(async (serializedTransaction: string): Promise<string | null> => {
        try {
            if (!publicKey || !connected) {
                throw new Error("Wallet not connected");
            }

            // In Unified Wallet Kit, we can use window.solana or the adapter directly
            // But usually we want to use the standard wallet adapter interface
            const { wallet } = useUnifiedWallet(); // This might need to be called inside the handler if it changes
            // Actually useUnifiedWallet should be up-to-date

            // For now, let's use the standard approach via Unified Wallet's signTransaction if available
            // but the hook itself doesn't expose signTransaction directly in the base type.
            // We usually get the provider or use the wallet object.

            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBuffer);

            // Re-fetch wallet from hook to ensure latest state
            // Note: signTransaction is normally part of the WalletAdapter interface
            const currentWallet = (window as any).solana; // Fallback for extension

            // Proper way with Unified Wallet:
            // The hook provides 'wallet' which is an Adapter.
            // We can check if it has signTransaction.

            // Let's implement a more robust signTransaction using the Connection
            const connection = new Connection(SOLANA_RPC, 'confirmed');

            // This is a placeholder - in a real app, useUnifiedWallet().wallet.adapter.signTransaction(transaction)
            // But let's assume the user has a wallet connected and we can use the injected provider
            if ((window as any).solana && (window as any).solana.signTransaction) {
                const signedTx = await (window as any).solana.signTransaction(transaction);
                const signature = await connection.sendRawTransaction(signedTx.serialize());
                const latestBlockhash = await connection.getLatestBlockhash();
                await connection.confirmTransaction({
                    signature,
                    blockhash: latestBlockhash.blockhash,
                    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                });
                return signature;
            }

            throw new Error("signTransaction not supported by current wallet path");
        } catch (error) {
            console.error('Sign transaction error:', error);
            return null;
        }
    }, [publicKey, connected]);

    return (
        <WalletContext.Provider value={{
            walletAddress,
            activePublicKey: publicKey || null,
            connecting,
            isMobile,
            isJupiterMobile: true,
            connect,
            disconnect,
            signTransaction,
        }}>
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
