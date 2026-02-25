'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { VersionedTransaction, Connection, PublicKey } from '@solana/web3.js';
import { JupiterMobileAdapter } from '@defi-quest/core';
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

    // Define the solana chain manually to ensure precise structure for AppKit
    const solanaChain = {
        chainId: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet Genesis Hash
        name: 'Solana',
        currency: 'SOL',
        explorerUrl: 'https://explorer.solana.com',
        rpcUrl: SOLANA_RPC,
        rpcUrls: {
            default: { http: [SOLANA_RPC] },
            public: { http: [SOLANA_RPC] }
        },
        chainNamespace: 'solana' as const
    };

    const [showQRModal, setShowQRModal] = useState(false);
    const [qrUri, setQrUri] = useState<string | null>(null);
    const [qrImage, setQrImage] = useState<string | null>(null);

    // Initialize custom Jupiter Mobile Adapter
    const adapterRef = useRef<JupiterMobileAdapter | null>(null);

    if (!adapterRef.current) {
        adapterRef.current = new JupiterMobileAdapter({
            projectId: REOWN_PROJECT_ID,
            network: 'mainnet-beta',
            rpcUrl: SOLANA_RPC,
        });
    }

    const jupiterAdapter = adapterRef.current;

    useEffect(() => {
        jupiterAdapter.initialize();
    }, [jupiterAdapter]);

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

        const handleConnected = ({ state }: any) => {
            setActivePublicKey(state.publicKey);
            setConnecting(false);
            setShowQRModal(false);
        };

        const handleDisconnected = () => {
            setActivePublicKey(null);
            setConnecting(false);
            localStorage.removeItem('walletAddress');
        };

        const handleUri = async ({ uri }: { uri: string }) => {
            setQrUri(uri);
            try {
                const url = await QRCode.toDataURL(uri);
                setQrImage(url);
            } catch (err) {
                console.error('Failed to generate QR code:', err);
            }
        };

        jupiterAdapter.on('mobile:connected', handleConnected);
        jupiterAdapter.on('mobile:disconnected', handleDisconnected);
        jupiterAdapter.on('mobile:accountChanged', handleConnected); // Use same handler as connected
        jupiterAdapter.on('mobile:uri', handleUri);

        // Check if already connected
        const state = jupiterAdapter.getState();
        if (state.connected && state.publicKey) {
            setActivePublicKey(state.publicKey);
        }

        return () => {
            jupiterAdapter.off('mobile:connected', handleConnected);
            jupiterAdapter.off('mobile:disconnected', handleDisconnected);
            jupiterAdapter.off('mobile:accountChanged', handleConnected);
            jupiterAdapter.off('mobile:uri', handleUri);
        };
    }, [jupiterAdapter]);

    const connect = async () => {
        if (!jupiterAdapter) return;
        setConnecting(true);
        try {
            if (jupiterAdapter.isMobile()) {
                await jupiterAdapter.connect();
            } else {
                // For desktop, show QR fallback
                setShowQRModal(true);
                await jupiterAdapter.getConnectionUri();
                await jupiterAdapter.completeConnection();
            }
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
            if (!jupiterAdapter || !jupiterAdapter.isConnected()) {
                throw new Error("Wallet not connected");
            }

            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBuffer);

            // Use the adapter's signAndSendTransaction which handles everything
            const signature = await jupiterAdapter.signAndSendTransaction(transaction);
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
            showQRModal,
            qrUri,
            connect,
            disconnect,
            signTransaction,
            closeQRModal: () => setShowQRModal(false)
        }}>
            {children}
            {showQRModal && qrImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#00ff00]/20 bg-[#0a0a0c] p-8 text-center shadow-[0_0_50px_rgba(0,255,0,0.1)]">
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="mb-2 text-xl font-bold tracking-tight text-[#00ff00]">
                            Connect Jupiter Mobile
                        </h3>
                        <p className="mb-6 text-sm text-gray-400">
                            Scan this QR code with your Jupiter Mobile app to connect your wallet.
                        </p>

                        <div className="mx-auto mb-6 aspect-square w-full max-w-[240px] overflow-hidden rounded-xl bg-white p-4 shadow-inner">
                            <img src={qrImage} alt="Connection QR Code" className="h-full w-full" />
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 italic">
                                Requires Jupiter Mobile app — available on iOS & Android
                            </p>
                            <div className="flex justify-center gap-4">
                                <a href="https://jup.ag/mobile" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00ff00] hover:underline">
                                    Download App
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
