/**
 * DeFi Quest Engine - Anchor Program Client
 * TypeScript bindings for the Solana Anchor program
 */

import {
  Connection,
  PublicKey,
  Signer,
} from '@solana/web3.js';
import { Idl, Program, BN } from '@coral-xyz/anchor';

// Program ID (from Anchor.toml / deployment)
export const QUEST_PROGRAM_ID = new PublicKey('CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp');

// PDA seeds
export const CONFIG_SEED = 'config';
export const MISSION_SEED = 'mission';
export const PROGRESS_SEED = 'progress';

/**
 * Get the config PDA
 */
export function getConfigPda(programId: PublicKey = QUEST_PROGRAM_ID): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    programId
  );
  return pda;
}

/**
 * Get a mission PDA by mission ID
 */
export function getMissionPda(
  missionId: string,
  programId: PublicKey = QUEST_PROGRAM_ID
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(MISSION_SEED), Buffer.from(missionId)],
    programId
  );
  return pda;
}

/**
 * Get user progress PDA
 */
export function getProgressPda(
  user: PublicKey,
  mission: PublicKey,
  programId: PublicKey = QUEST_PROGRAM_ID
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PROGRESS_SEED), user.toBytes(), mission.toBytes()],
    programId
  );
  return pda;
}

/**
 * Mission data from the Anchor program
 */
export interface AnchorMission {
  authority: PublicKey;
  missionId: string;
  missionType: number;
  requirement: MissionRequirementAnchor;
  reward: MissionRewardAnchor;
  metadataUri: string;
  active: boolean;
  completions: number;
  createdAt: BN;
  bump: number;
}

export interface MissionRequirementAnchor {
  inputToken: PublicKey | null;
  outputToken: PublicKey | null;
  minAmount: BN;
  targetVolume: BN | null;
  requiredDays: number | null;
}

export interface MissionRewardAnchor {
  xp: BN;
  tokenAmount: BN | null;
  badgeType: string | null;
}

/**
 * User progress data from the Anchor program
 */
export interface AnchorUserProgress {
  user: PublicKey;
  mission: PublicKey;
  startedAt: BN;
  currentValue: BN;
  completed: boolean;
  completedAt: BN | null;
  claimed: boolean;
  claimedAt: BN | null;
  swapSignatures: string[];
  bump: number;
}

/**
 * Anchor Quest Client - Main class for interacting with the program
 * Uses any types to avoid Anchor version conflicts
 */
export class AnchorQuestClient {
  private program: any = null;
  private connection: Connection;
  private wallet: Signer;
  private idl: Idl | null = null;

  constructor(
    connection: Connection,
    wallet: Signer,
    idl?: Idl
  ) {
    this.connection = connection;
    this.wallet = wallet;

    if (idl) {
      this.idl = idl;
      // Use dynamic import to create program
      const { Program, AnchorProvider } = require('@coral-xyz/anchor');
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      this.program = new Program(idl, QUEST_PROGRAM_ID, provider);
    } else {
      // Try to load IDL dynamically
      try {
        const { IDL } = require('./defi_quest_idl');
        this.idl = IDL as Idl;
        const { Program, AnchorProvider } = require('@coral-xyz/anchor');
        const provider = new AnchorProvider(connection, wallet as any, {
          commitment: 'confirmed',
        });
        this.program = new Program(this.idl, QUEST_PROGRAM_ID, provider);
      } catch (e) {
        console.warn('[AnchorQuestClient] No IDL provided and none found');
      }
    }
  }

  isReady(): boolean {
    return this.program !== null;
  }

  async initialize(): Promise<string> {
    if (!this.program) throw new Error('Program not initialized');

    const tx = await this.program.methods
      .initialize()
      .accounts({
        config: getConfigPda(),
        authority: this.wallet.publicKey,
        systemProgram: PublicKey.default,
      })
      .rpc();

    return tx;
  }

  async registerMission(
    missionId: string,
    missionType: string,
    requirement: any,
    reward: any,
    metadataUri: string = ''
  ): Promise<string> {
    if (!this.program) throw new Error('Program not initialized');

    const tx = await this.program.methods
      .registerMission(
        missionId,
        { [missionType]: {} },
        requirement,
        reward,
        metadataUri
      )
      .accounts({
        mission: getMissionPda(missionId),
        config: getConfigPda(),
        authority: this.wallet.publicKey,
        systemProgram: PublicKey.default,
      })
      .rpc();

    return tx;
  }

  async startMission(missionId: string, user: PublicKey): Promise<string> {
    if (!this.program) throw new Error('Program not initialized');

    const missionPda = getMissionPda(missionId);
    const progressPda = getProgressPda(user, missionPda);

    return await this.program.methods
      .startMission()
      .accounts({
        progress: progressPda,
        mission: missionPda,
        user: user,
        systemProgram: PublicKey.default,
      })
      .rpc();
  }

  async submitProof(
    missionId: string,
    user: PublicKey,
    swapSignature: string,
    swapAmount: number,
    inputToken: string,
    outputToken: string
  ): Promise<string> {
    if (!this.program) throw new Error('Program not initialized');

    const missionPda = getMissionPda(missionId);
    const progressPda = getProgressPda(user, missionPda);

    return await this.program.methods
      .submitProof(
        swapSignature,
        new BN(swapAmount),
        new PublicKey(inputToken),
        new PublicKey(outputToken)
      )
      .accounts({
        progress: progressPda,
        mission: missionPda,
        user: user,
      })
      .rpc();
  }

  async claimReward(missionId: string, user: PublicKey): Promise<string> {
    if (!this.program) throw new Error('Program not initialized');

    const missionPda = getMissionPda(missionId);
    const progressPda = getProgressPda(user, missionPda);
    const configPda = getConfigPda();

    return await this.program.methods
      .claimReward()
      .accounts({
        progress: progressPda,
        mission: missionPda,
        config: configPda,
        user: user,
      })
      .rpc();
  }

  async getMission(missionId: string): Promise<AnchorMission | null> {
    if (!this.program) return null;

    try {
      const missionPda = getMissionPda(missionId);
      return await this.program.account.mission.fetch(missionPda);
    } catch {
      return null;
    }
  }

  async getUserProgress(missionId: string, userAddress: PublicKey): Promise<AnchorUserProgress | null> {
    if (!this.program) return null;

    try {
      const missionPda = getMissionPda(missionId);
      const progressPda = getProgressPda(userAddress, missionPda);
      return await this.program.account.userProgress.fetch(progressPda);
    } catch {
      return null;
    }
  }

  async getConfig(): Promise<any | null> {
    if (!this.program) return null;

    try {
      const configPda = getConfigPda();
      return await this.program.account.config.fetch(configPda);
    } catch {
      return null;
    }
  }

  onMissionRegistered(callback: (event: any) => void): number | null {
    if (!this.program) return null;
    return this.program.addEventListener('missionRegisteredEvent', callback);
  }

  onMissionStarted(callback: (event: any) => void): number | null {
    if (!this.program) return null;
    return this.program.addEventListener('missionStartedEvent', callback);
  }

  onMissionCompleted(callback: (event: any) => void): number | null {
    if (!this.program) return null;
    return this.program.addEventListener('missionCompletedEvent', callback);
  }

  onRewardClaimed(callback: (event: any) => void): number | null {
    if (!this.program) return null;
    return this.program.addEventListener('rewardClaimedEvent', callback);
  }

  async removeEventListener(listenerId: number): Promise<void> {
    if (this.program) {
      await this.program.removeEventListener(listenerId);
    }
  }
}

export function anchorMissionToMission(anchorMission: AnchorMission): any {
  const typeMap: string[] = ['swap', 'volume', 'streak', 'dca', 'limit_order', 'price', 'routing'];

  return {
    id: anchorMission.missionId,
    type: typeMap[anchorMission.missionType] || 'unknown',
    active: anchorMission.active,
    completions: anchorMission.completions,
    createdAt: new Date(anchorMission.createdAt.toNumber() * 1000),
  };
}