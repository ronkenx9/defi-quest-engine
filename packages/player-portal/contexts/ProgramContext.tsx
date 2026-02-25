'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useWallet } from './WalletContext';

const PROGRAM_ID = 'CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp';

interface ProgramContextType {
  program: Program | null;
  connection: Connection;
  programId: PublicKey;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet-beta';
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || (CLUSTER === 'mainnet-beta' ? 'https://mainnet.helius-rpc.com/?api-key=4a0edae8-86c3-4445-b4b2-46ddc60cb237' : 'https://api.devnet.solana.com');

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { walletAddress } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [connection] = useState<Connection>(new Connection(RPC_URL));
  const [programId] = useState<PublicKey>(new PublicKey(PROGRAM_ID));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function initProgram() {
      // If not mounted yet, or walletAddress is not available, defer initialization.
      // The `mounted` check prevents hydration issues.
      // The `walletAddress` check ensures we have a connected wallet before trying to init Anchor.
      if (!mounted || !walletAddress) {
        setInitialized(false); // Ensure it's false if wallet not connected
        setLoading(false);
        return;
      }

      try {
        setLoading(true); setError(null);

        // Final safety check for window.solana
        // We wait for the wallet to be TRULY ready (has publicKey and signTransaction)
        const solana = typeof window !== 'undefined' ? (window as any).solana : null;

        if (!solana || !solana.publicKey) {
          console.log('[ProgramContext] Wallet object detected but publicKey is missing, retrying in 1s...');
          // Optional: Add a small retry if we know we are "connected" but publicKey is lagging
          setTimeout(() => initProgram(), 1000);
          return;
        }

        const provider = new AnchorProvider(
          connection,
          solana as unknown as AnchorProvider['wallet'],
          { ...AnchorProvider.defaultOptions(), commitment: 'processed', skipPreflight: true }
        );

        const idl = await loadIDL();
        if (!idl) throw new Error('Failed to load IDL');

        // @ts-ignore - IDL type mismatch in some environments
        const programInstance = new Program(idl, provider);

        console.log('[ProgramContext] Program initialized successfully');
        setProgram(programInstance);
        setInitialized(true);
      } catch (err) {
        console.error('[ProgramContext] Failed to init program:', err);
        setError(err instanceof Error ? err.message : 'Failed');
        setInitialized(true); // Mark as initialized even on error to stop retries
      } finally { setLoading(false); }
    }

    initProgram();
  }, [connection, walletAddress, mounted]); // Added mounted to dependencies

  if (!mounted) return null;

  return <ProgramContext.Provider value={{ program, connection, programId, loading, error, initialized }}>{children}</ProgramContext.Provider>;
}

export function useProgram() {
  const context = useContext(ProgramContext);
  if (context === undefined) throw new Error('useProgram must be used within ProgramProvider');
  return context;
}

async function loadIDL() {
  return {
    version: '0.1.0',
    name: 'defi_quest',
    instructions: [
      {
        name: 'initialize',
        accounts: [
          { name: 'config', isMut: true, isSigner: false, pda: { seeds: [{ kind: 'const', value: [99, 111, 110, 102, 105, 103] }] } },
          { name: 'authority', isMut: true, isSigner: true },
          { name: 'system_program', isMut: false, isSigner: false, address: '11111111111111111111111111111111' }
        ],
        args: []
      },
      {
        name: 'register_mission',
        accounts: [
          { name: 'mission', isMut: true, isSigner: false, pda: { seeds: [{ kind: 'const', value: [109, 105, 115, 115, 105, 111, 110] }, { kind: 'arg', path: 'mission_id' }] } },
          { name: 'config', isMut: true, isSigner: false },
          { name: 'authority', isMut: true, isSigner: true },
          { name: 'system_program', isMut: false, isSigner: false }
        ],
        args: [
          { name: 'mission_id', type: 'string' },
          { name: 'mission_type', type: { defined: 'MissionType' } },
          { name: 'requirement', type: { defined: 'MissionRequirement' } },
          { name: 'reward', type: { defined: 'MissionReward' } },
          { name: 'metadata_uri', type: 'string' }
        ]
      },
      {
        name: 'start_mission',
        accounts: [
          { name: 'progress', isMut: true, isSigner: false, pda: { seeds: [{ kind: 'const', value: [112, 114, 111, 103, 114, 101, 115, 115] }, { kind: 'account', path: 'user' }, { kind: 'account', path: 'mission' }] } },
          { name: 'mission', isMut: false, isSigner: false },
          { name: 'user', isMut: true, isSigner: true },
          { name: 'system_program', isMut: false, isSigner: false }
        ],
        args: []
      },
      {
        name: 'submit_proof',
        accounts: [
          { name: 'progress', isMut: true, isSigner: false },
          { name: 'mission', isMut: true, isSigner: false },
          { name: 'user', isMut: false, isSigner: true }
        ],
        args: [
          { name: 'swap_signature', type: 'string' },
          { name: 'swap_amount', type: 'u64' },
          { name: 'input_token', type: 'pubkey' },
          { name: 'output_token', type: 'pubkey' }
        ]
      },
      {
        name: 'claim_reward',
        accounts: [
          { name: 'progress', isMut: true, isSigner: false },
          { name: 'mission', isMut: false, isSigner: false },
          { name: 'config', isMut: false, isSigner: false },
          { name: 'reward_vault', isMut: true, isSigner: false, optional: true },
          { name: 'user_token_account', isMut: true, isSigner: false, optional: true },
          { name: 'user', isMut: true, isSigner: true },
          { name: 'token_program', isMut: false, isSigner: false, optional: true }
        ],
        args: []
      }
    ],
    accounts: [
      { name: 'Config', type: { kind: 'struct', fields: [{ name: 'authority', type: 'pubkey' }, { name: 'mission_count', type: 'u64' }, { name: 'total_completions', type: 'u64' }, { name: 'bump', type: 'u8' }] } },
      { name: 'Mission', type: { kind: 'struct', fields: [{ name: 'authority', type: 'pubkey' }, { name: 'mission_id', type: 'string' }, { name: 'active', type: 'bool' }, { name: 'completions', type: 'u64' }, { name: 'bump', type: 'u8' }] } },
      { name: 'UserProgress', type: { kind: 'struct', fields: [{ name: 'user', type: 'pubkey' }, { name: 'mission_id', type: 'string' }, { name: 'is_completed', type: 'bool' }, { name: 'completed_at', type: 'i64' }, { name: 'claimed', type: 'bool' }] } }
    ],
    types: [
      { name: 'MissionType', type: { kind: 'enum', variants: [{ name: 'Swap' }, { name: 'Hold' }, { name: 'Stake' }] } },
      { name: 'MissionRequirement', type: { kind: 'struct', fields: [{ name: 'min_amount', type: 'u16' }, { name: 'target_token', type: 'pubkey' }] } },
      { name: 'MissionReward', type: { kind: 'struct', fields: [{ name: 'xp', type: 'u32' }, { name: 'token_amount', type: 'u64' }] } }
    ]
  };
}

