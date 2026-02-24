'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { VersionedTransaction, Connection, PublicKey } from '@solana/web3.js';
import { JupiterMobileAdapter } from '@defi-quest/core';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import QRCode from 'qrcode';
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextType {
    walletAddress: string | null;
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
const REOWN_PROJECT_ID = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '4eS8SJVEj8xY3qNRHh1Lz6aX2nGBk7kK5YvXjBxKQqC';

async function ensurePlayerProfile(publicKey: PublicKey) {
    try {
        const { supabase } = await import('@/lib/supabase');

        const { data: userData } = await supabase
            .from('user_stats')
            .select('profile_nft_address')
            .eq('wallet_address', publicKey.toString())
            .single();

        if (!userData?.profile_nft_address) {
            console.log('Minting player profile NFT...');

            const { PlayerProfileNFT } = await import('@defi-quest/core');
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
            const profileSystem = new PlayerProfileNFT(rpcUrl);

            const profileAddress = await profileSystem.mintProfile(
                publicKey,
                `Player_${publicKey.toString().slice(0, 6)}`
            );

            await supabase.from('user_stats').upsert({
                wallet_address: publicKey.toString(),
                profile_nft_address: profileAddress.toString(),
                username: `Player_${publicKey.toString().slice(0, 6)}`,
                total_points: 0,
                level: 1
            });

            console.log('Profile NFT minted:', profileAddress.toString());
            return profileAddress;
        }

        return userData.profile_nft_address;
    } catch (error) {
        console.error('Failed to ensure profile:', error);
        return null;
    }
}

function QRCodeModal({ uri, onClose }: { uri: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !uri) return;

        QRCode.toCanvas(canvasRef.current, uri, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }).catch(console.error);
    }, [uri]);

    const copyUri = () => {
        navigator.clipboard.writeText(uri);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadLinks = JupiterMobileAdapter.getDownloadLinks();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0f0a] border border-[#4ade80]/30 rounded-xl p-6 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#c7f284" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="4" fill="#c7f284" />
                            <path d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22" stroke="#c7f284" strokeWidth="1.2" />
                            <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22" stroke="#c7f284" strokeWidth="1.2" />
                        </svg>
                        <h3 className="text-[#c7f284] font-['Orbitron'] font-bold text-sm">JUPITER MOBILE</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                    <canvas ref={canvasRef} className="w-full h-auto" />
                </div>

                <p className="text-gray-400 text-xs text-center mb-4">
                    Scan with Jupiter Mobile app to connect
                </p>

                <button
                    onClick={copyUri}
                    className="w-full py-2 px-4 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-xs font-mono mb-3 hover:bg-[#4ade80]/20 transition-colors"
                >
                    {copied ? 'COPIED!' : 'COPY DEEP LINK'}
                </button>

                <div className="flex gap-2">
                    <a
                        href={downloadLinks.ios}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-lg bg-[#1a1f12] border border-[#8fb36c]/30 text-[#8fb36c] text-xs text-center hover:border-[#c7f284]/50 transition-colors"
                    >
                        iOS
                    </a>
                    <a
                        href={downloadLinks.android}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-lg bg-[#1a1f12] border border-[#8fb36c]/30 text-[#8fb36c] text-xs text-center hover:border-[#c7f284]/50 transition-colors"
                    >
                        Android
                    </a>
                </div>
            </div>
        </div>
    );
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const endpoint = SOLANA_RPC;

    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletContextProviderInner>
                        {children}
                    </WalletContextProviderInner>
                </WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}

function WalletContextProviderInner({ children }: { children: ReactNode }) {
    const { publicKey, connecting: solanaConnecting, disconnect: solanaDisconnect, signTransaction: solanaSignTransaction, sendTransaction } = useSolanaWallet();
    const { setVisible } = useWalletModal();
    const [isMobile, setIsMobile] = useState(false);
    const [isJupiterMobile, setIsJupiterMobile] = useState(false);
    const [mobileWalletAddress, setMobileWalletAddress] = useState<string | null>(null);
    const [mobilePublicKey, setMobilePublicKey] = useState<PublicKey | null>(null);
    const [mobileAdapter, setMobileAdapter] = useState<JupiterMobileAdapter | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrUri, setQrUri] = useState<string | null>(null);

    const activePublicKey = publicKey || mobilePublicKey;

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream)) {
                setIsMobile(true);
            }
        };
        checkMobile();
    }, []);

    const closeQRModal = useCallback(() => {
        setShowQRModal(false);
        setQrUri(null);
    }, []);

    const connect = async () => {
        // For desktop: Show QR modal for Jupiter Mobile
        if (!isMobile) {
            try {
                const adapter = new JupiterMobileAdapter({
                    projectId: REOWN_PROJECT_ID,
                    network: 'mainnet-beta',
                    rpcUrl: SOLANA_RPC
                });

                await adapter.initialize();

                // Get WalletConnect URI for QR code
                const uri = await adapter.getConnectionUri();
                setQrUri(uri);
                setShowQRModal(true);

                // Set up listener for connection completion
                adapter.on('mobile:connected', ({ state }) => {
                    closeQRModal();
                    if (state.connected && state.publicKey) {
                        setMobileWalletAddress(state.address);
                        setMobilePublicKey(state.publicKey);
                        setMobileAdapter(adapter);
                        setIsJupiterMobile(true);
                    }
                });

                // Also try to complete connection (for mobile deep link fallback)
                try {
                    const state = await adapter.completeConnection();
                    closeQRModal();
                    if (state.connected && state.publicKey) {
                        setMobileWalletAddress(state.address);
                        setMobilePublicKey(state.publicKey);
                        setMobileAdapter(adapter);
                        setIsJupiterMobile(true);
                    }
                } catch (e) {
                    // QR code shown, waiting for user to scan
                    console.log('Waiting for QR scan...');
                }
            } catch (error) {
                console.error('Jupiter Mobile connection failed:', error);
                // Fall back to standard modal
                setVisible(true);
            }
            return;
        }

        // For mobile: Use Jupiter Mobile deep link
        try {
            const adapter = new JupiterMobileAdapter({
                projectId: REOWN_PROJECT_ID,
                network: 'mainnet-beta',
                rpcUrl: SOLANA_RPC
            });

            await adapter.initialize();
            const result = await adapter.connect();

            if (result && result.connected && result.publicKey) {
                setMobileWalletAddress(result.address);
                setMobilePublicKey(result.publicKey);
                setMobileAdapter(adapter);
                setIsJupiterMobile(result.isJupiterMobile);
            }
        } catch (error) {
            console.error('Jupiter Mobile connection failed:', error);
            setVisible(true);
        }
    };

    useEffect(() => {
        if (activePublicKey) {
            ensurePlayerProfile(activePublicKey);
        }
    }, [activePublicKey]);

    const disconnect = () => {
        solanaDisconnect();
        localStorage.removeItem('walletAddress');

        if (mobileAdapter) {
            mobileAdapter.disconnect();
            setMobileWalletAddress(null);
            setMobilePublicKey(null);
            setMobileAdapter(null);
            setIsJupiterMobile(false);
        }
    };

    const signTransaction = useCallback(async (serializedTransaction: string): Promise<string | null> => {
        try {
            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBuffer);

            if (mobileAdapter) {
                return await mobileAdapter.signAndSendTransaction(transaction);
            }

            const connection = new Connection(SOLANA_RPC, 'confirmed');

            if (!solanaSignTransaction) {
                if (!sendTransaction) throw new Error("Wallet does not support signing or sending");

                const signature = await sendTransaction(transaction, connection);
                return signature;
            }

            const signedTx = await solanaSignTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Sign transaction error:', error);
            return null;
        }
    }, [solanaSignTransaction, sendTransaction, mobileAdapter]);

    const walletAddress = activePublicKey ? activePublicKey.toString() : null;

    useEffect(() => {
        if (walletAddress) {
            localStorage.setItem('walletAddress', walletAddress);
        }
    }, [walletAddress]);

    return (
        <WalletContext.Provider value={{
            walletAddress,
            connecting: solanaConnecting,
            isMobile,
            isJupiterMobile,
            showQRModal,
            qrUri,
            connect,
            disconnect,
            signTransaction,
            closeQRModal
        }}>
            {children}
            {showQRModal && qrUri && <QRCodeModal uri={qrUri} onClose={closeQRModal} />}
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
