'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { VersionedTransaction, Connection, PublicKey } from '@solana/web3.js';
import { connectJupiterMobile } from '@/lib/wallet/JupiterMobileAuth';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

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

async function ensurePlayerProfile(publicKey: PublicKey) {
    try {
        const { supabase } = await import('@/lib/supabase');

        // Check if profile NFT exists
        const { data: userData } = await supabase
            .from('user_stats')
            .select('profile_nft_address')
            .eq('wallet_address', publicKey.toString())
            .single();

        if (!userData?.profile_nft_address) {
            console.log('Minting player profile NFT...');

            // Mint profile NFT
            const { PlayerProfileNFT } = await import('@defi-quest/core');
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
            const profileSystem = new PlayerProfileNFT(rpcUrl);

            const profileAddress = await profileSystem.mintProfile(
                publicKey,
                `Player_${publicKey.toString().slice(0, 6)}`
            );

            // Save to database
            await supabase.from('user_stats').upsert({
                wallet_address: publicKey.toString(),
                profile_nft_address: profileAddress.toString(),
                username: `Player_${publicKey.toString().slice(0, 6)}`,
                total_points: 0,
                level: 1
            });

            console.log('✅ Profile NFT minted:', profileAddress.toString());

            return profileAddress;
        }

        return userData.profile_nft_address;

    } catch (error) {
        console.error('Failed to ensure profile:', error);
        // Non-fatal, continue anyway
        return null;
    }
}

export function WalletProvider({ children }: { children: ReactNode }) {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const endpoint = SOLANA_RPC;

    const wallets = useMemo(
        () => [
            // Standard wallet adapters are auto-detected. 
            // The Sollet, Solflare, Phantom adapters etc are generally baked in.
        ],
        []
    );

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
    const { publicKey, connecting, disconnect: solanaDisconnect, signTransaction: solanaSignTransaction, sendTransaction } = useSolanaWallet();
    const { setVisible } = useWalletModal();
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
    }, []);

    const connect = async () => {
        // Exclusively use Jupiter Mobile connection
        try {
            const connection = new Connection(SOLANA_RPC, 'confirmed');
            const result = await connectJupiterMobile(connection, 'mainnet');
            if (result) {
                // Connection succeeds. 
                // Context doesn't natively lift authResult via state yet, but this fulfills the lock-in
                return;
            }
        } catch (error) {
            console.error('Jupiter Mobile connection failed:', error);
            alert('This platform exclusively requires Jupiter Mobile integration. Please connect via a supported mobile interface.');
        }
    };

    // Ensure Profile NFT Minting
    useEffect(() => {
        if (publicKey) {
            // Mint profile NFT on first connect
            ensurePlayerProfile(publicKey);
        }
    }, [publicKey]);

    const disconnect = () => {
        solanaDisconnect();
        localStorage.removeItem('walletAddress');
    };

    /**
     * Sign and send a transaction via WalletAdapter
     * @param serializedTransaction - Base64 encoded transaction
     * @returns Transaction signature or null if failed
     */
    const signTransaction = useCallback(async (serializedTransaction: string): Promise<string | null> => {
        try {
            const transactionBuffer = Uint8Array.from(atob(serializedTransaction), c => c.charCodeAt(0));
            const transaction = VersionedTransaction.deserialize(transactionBuffer);
            const connection = new Connection(SOLANA_RPC, 'confirmed');

            if (!solanaSignTransaction) {
                // If the wallet does not support individual signing, use sendTransaction
                if (!sendTransaction) throw new Error("Wallet does not support signing or sending");

                const signature = await sendTransaction(transaction, connection);
                return signature;
            }

            // Wallet supports signing explicitly
            const signedTx = await solanaSignTransaction(transaction);

            // Standard raw send
            const signature = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(signature, 'confirmed');

            return signature;
        } catch (error) {
            console.error('Sign transaction error:', error);
            return null;
        }
    }, [solanaSignTransaction, sendTransaction]);

    const walletAddress = publicKey ? publicKey.toString() : null;

    useEffect(() => {
        if (walletAddress) {
            localStorage.setItem('walletAddress', walletAddress);
        }
    }, [walletAddress]);

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
