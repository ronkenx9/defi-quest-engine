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

  useEffect(() => {
    async function initProgram() {
      if (!walletAddress) { setInitialized(true); setLoading(false); return; }
      try {
        setLoading(true); setError(null);
        const solana = (window as unknown as { solana?: { isPhantom?: boolean } }).solana;
        if (!solana?.isPhantom) throw new Error('Phantom wallet not found');
        const provider = new AnchorProvider(connection, solana as unknown as AnchorProvider['wallet'], AnchorProvider.defaultOptions());
        const idl = await loadIDL();
        // @ts-ignore - IDL type mismatch in some environments
        const programInstance = new Program(idl, provider);
        setProgram(programInstance); setInitialized(true);
      } catch (err) {
        console.error('Failed to init program:', err);
        setError(err instanceof Error ? err.message : 'Failed'); setInitialized(true);
      } finally { setLoading(false); }
    }
    initProgram();
  }, [walletAddress, connection, programId]);

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

