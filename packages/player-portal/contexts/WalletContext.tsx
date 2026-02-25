'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { VersionedTransaction, Connection, PublicKey } from '@solana/web3.js';
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import QRCode from 'qrcode';

interface WalletContextType {
    walletAddress: string | null;
    activePublicKey: PublicKey | null;
    connecting: boolean;
    isMobile: boolean;
    isJupiterMobile: boolean;
    showQRModal: boolean;
    qrUri: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    signTransaction: (serializedTransaction: string) => Promise<string | null>;
    closeQRModal: () => void;
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

function QRCodeModal() {
    return null; // The official adapter handles its own modal
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const endpoint = SOLANA_RPC;

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletContextProviderInner>
                {children}
            </WalletContextProviderInner>
        </ConnectionProvider>
    );
}

function WalletContextProviderInner({ children }: { children: ReactNode }) {
    const [isMobile, setIsMobile] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [activePublicKey, setActivePublicKey] = useState<PublicKey | null>(null);

    // Initialize official Jupiter Mobile Adapter
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
            // Disable injected providers to avoid "Cannot redefine property: ethereum" conflict with Bybit/other wallets
            enableInjected: false,
            enableEIP6963: false,
            // Hide all wallets list to potentially avoid 403 on getWallets if project is restricted
            allWallets: 'HIDE',
            enableWallets: false,
        },
    });

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream)) {
                setIsMobile(true);
            }
        };
        checkMobile();
    }, []);

    // Monitor adapter state
    useEffect(() => {
        if (!jupiterAdapter) return;

        const handleConnect = () => {
            if (jupiterAdapter.publicKey) {
                setActivePublicKey(jupiterAdapter.publicKey);
                setConnecting(false);
            }
        };

        const handleDisconnect = () => {
            setActivePublicKey(null);
            setConnecting(false);
            localStorage.removeItem('walletAddress');
        };

        jupiterAdapter.on('connect', handleConnect);
        jupiterAdapter.on('disconnect', handleDisconnect);

        // Check if already connected
        if (jupiterAdapter.connected && jupiterAdapter.publicKey) {
            handleConnect();
        }

        return () => {
            jupiterAdapter.off('connect', handleConnect);
            jupiterAdapter.off('disconnect', handleDisconnect);
        };
    }, [jupiterAdapter]);

    const connect = async () => {
        if (!jupiterAdapter) return;
        setConnecting(true);
        try {
            await jupiterAdapter.connect();
        } catch (error) {
            console.error('Jupiter connection failed:', error);
            setConnecting(false);
        }
    };

    const disconnect = async () => {
        if (!jupiterAdapter) return;
        try {
            await jupiterAdapter.disconnect();
        } catch (error) {
            console.error('Jupiter disconnect failed:', error);
        }
    };

    useEffect(() => {
        if (activePublicKey) {
            ensurePlayerProfile(activePublicKey);
        }
    }, [activePublicKey]);

    const signTransaction = useCallback(async (serializedTransaction: string): Promise<string | null> => {
        try {
            if (!jupiterAdapter || !jupiterAdapter.connected) {
                throw new Error("Wallet not connected");
            }

            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBuffer);

            // Use the adapter's signTransaction
            const signedTx = await jupiterAdapter.signTransaction(transaction);

            // Send the signed transaction
            const connection = new Connection(SOLANA_RPC, 'confirmed');
            const signature = await connection.sendRawTransaction(signedTx.serialize());

            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });

            return signature;
        } catch (error) {
            console.error('Sign transaction error:', error);
            return null;
        }
    }, [jupiterAdapter]);

    const walletAddress = activePublicKey ? activePublicKey.toString() : null;

    useEffect(() => {
        if (walletAddress) {
            localStorage.setItem('walletAddress', walletAddress);
        }
    }, [walletAddress]);

    return (
        <WalletContext.Provider value={{
            walletAddress: activePublicKey ? activePublicKey.toString() : null,
            activePublicKey,
            connecting,
            isMobile,
            isJupiterMobile: true,
            showQRModal: false,
            qrUri: null,
            connect,
            disconnect,
            signTransaction,
            closeQRModal: () => { }
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
