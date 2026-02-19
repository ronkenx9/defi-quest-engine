/**
 * DeFi Quest Engine - Anchor Event Indexer
 * Watches on-chain events and syncs to Supabase for dashboard display
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetaplexAnchorIntegrator } from '../metaplex/MetaplexAnchorIntegrator';

// Program ID
export const QUEST_PROGRAM_ID = new PublicKey('CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp');

/**
 * Indexer configuration
 */
export interface IndexerConfig {
  rpcUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  idl?: any;
  startSlot?: number;
}

/**
 * Mission data from on-chain event
 */
export interface MissionEventData {
  missionId: string;
  missionType: string;
  authority: string;
  metadataUri?: string;
}

/**
 * Progress data from on-chain event
 */
export interface ProgressEventData {
  user: string;
  mission: string;
  currentValue?: number;
  targetValue?: number;
}

/**
 * Anchor Event Indexer
 * Listens for on-chain events and syncs to Supabase
 */
export class AnchorIndexer {
  private connection: Connection;
  private program: any = null;
  private supabase: SupabaseClient;
  private listeners: number[] = [];
  private isRunning: boolean = false;
  private metaplexIntegrator: MetaplexAnchorIntegrator;

  constructor(config: IndexerConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');

    // Try to set up program
    if (config.idl) {
      try {
        const { Program, AnchorProvider } = require('@coral-xyz/anchor');
        const { Keypair } = require('@solana/web3.js');
        // Use a dummy keypair for the provider
        const dummyKeypair = Keypair.generate();
        const provider = new AnchorProvider(this.connection, dummyKeypair, {
          commitment: 'confirmed',
        });
        this.program = new Program(config.idl, QUEST_PROGRAM_ID, provider);
      } catch (e) {
        console.warn('[Indexer] Failed to create program:', e);
      }
    } else {
      // Try to load IDL
      try {
        const idl = require('./defi_quest.json');
        const { Program, AnchorProvider } = require('@coral-xyz/anchor');
        const { Keypair } = require('@solana/web3.js');
        const dummyKeypair = Keypair.generate();
        const provider = new AnchorProvider(this.connection, dummyKeypair, {
          commitment: 'confirmed',
        });
        this.program = new Program(idl, QUEST_PROGRAM_ID, provider);
      } catch (e) {
        console.warn('[Indexer] No IDL found, events will not be captured');
      }
    }

    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.metaplexIntegrator = new MetaplexAnchorIntegrator({
      rpcEndpoint: config.rpcUrl,
      programId: QUEST_PROGRAM_ID.toBase58(),
      authorityKey: '' // Not strictly needed by the current Implementation
    });
  }

  /**
   * Start the indexer - begins listening for events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Indexer] Already running');
      return;
    }

    if (!this.program) {
      console.warn('[Indexer] No program - cannot start event listeners');
      this.isRunning = true;
      return;
    }

    this.isRunning = true;
    console.log('[Indexer] Starting event listeners...');

    // Listen for mission registration
    const missionRegListener = this.program.addEventListener(
      'missionRegisteredEvent',
      async (event: any) => {
        console.log('[Indexer] Mission registered:', event.missionId);
        await this.handleMissionRegistered(event);
      }
    );
    this.listeners.push(missionRegListener);

    // Listen for mission starts
    const missionStartListener = this.program.addEventListener(
      'missionStartedEvent',
      async (event: any) => {
        console.log('[Indexer] Mission started');
        await this.handleMissionStarted(event);
      }
    );
    this.listeners.push(missionStartListener);

    // Listen for mission completions
    const missionCompleteListener = this.program.addEventListener(
      'missionCompletedEvent',
      async (event: any) => {
        console.log('[Indexer] Mission completed');
        await this.handleMissionCompleted(event);
      }
    );
    this.listeners.push(missionCompleteListener);

    // Listen for reward claims
    const rewardClaimedListener = this.program.addEventListener(
      'rewardClaimedEvent',
      async (event: any) => {
        console.log('[Indexer] Reward claimed');
        await this.handleRewardClaimed(event);
      }
    );
    this.listeners.push(rewardClaimedListener);

    console.log('[Indexer] Started successfully');
  }

  /**
   * Stop the indexer
   */
  async stop(): Promise<void> {
    console.log('[Indexer] Stopping...');

    if (this.program) {
      for (const listenerId of this.listeners) {
        await this.program.removeEventListener(listenerId);
      }
    }
    this.listeners = [];
    this.isRunning = false;

    console.log('[Indexer] Stopped');
  }

  /**
   * Handle mission registered event - sync to Supabase
   */
  private async handleMissionRegistered(event: any): Promise<void> {
    const missionId = event.missionId;
    const typeMap: string[] = ['swap', 'volume', 'streak', 'dca', 'limit_order', 'price', 'routing'];
    const missionType = typeMap[event.missionType] || 'unknown';

    try {
      const { error } = await this.supabase.from('missions').upsert({
        id: missionId,
        name: missionId,
        description: `On-chain mission: ${missionType}`,
        type: missionType,
        difficulty: 'medium',
        points: 100,
        is_active: true,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        console.error('[Indexer] Failed to sync mission:', error);
      } else {
        console.log('[Indexer] Mission synced to Supabase');
      }
    } catch (error) {
      console.error('[Indexer] Error handling mission registered:', error);
    }
  }

  /**
   * Handle mission started event
   */
  private async handleMissionStarted(event: any): Promise<void> {
    const userAddress = event.user?.toBase58?.() || event.user;
    const missionAddress = event.mission?.toBase58?.() || event.mission;

    try {
      const { error } = await this.supabase.from('mission_progress').upsert({
        wallet_address: userAddress,
        mission_id: missionAddress,
        status: 'active',
        current_value: 0,
        started_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet_address,mission_id'
      });

      if (error) {
        console.error('[Indexer] Failed to sync mission start:', error);
      }
    } catch (error) {
      console.error('[Indexer] Error handling mission start:', error);
    }
  }

  /**
   * Handle mission completed event
   */
  private async handleMissionCompleted(event: any): Promise<void> {
    const userAddress = event.user?.toBase58?.() || event.user;
    const missionAddress = event.mission?.toBase58?.() || event.mission;

    try {
      const { error } = await this.supabase
        .from('mission_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('wallet_address', userAddress)
        .eq('mission_id', missionAddress);

      if (error) {
        console.error('[Indexer] Failed to sync completion:', error);
      } else {
        await this.incrementUserStat(userAddress, 'total_missions_completed');
      }
    } catch (error) {
      console.error('[Indexer] Error handling mission completion:', error);
    }
  }

  /**
   * Handle reward claimed event
   */
  private async handleRewardClaimed(event: any): Promise<void> {
    const userAddress = event.user?.toBase58?.() || event.user;
    const missionAddress = event.mission?.toBase58?.() || event.mission;
    const xp = event.xp?.toNumber?.() || event.xp || 0;

    try {
      const { error } = await this.supabase
        .from('mission_progress')
        .update({ status: 'claimed' })
        .eq('wallet_address', userAddress)
        .eq('mission_id', missionAddress);

      if (error) {
        console.error('[Indexer] Failed to sync claim:', error);
        return;
      }

      await this.incrementUserStat(userAddress, 'total_points', xp);

      // Trigger Metaplex Core Badge Minting and Evolution
      try {
        await this.metaplexIntegrator.onRewardClaimed({
          user: userAddress,
          mission: missionAddress,
          xp: xp,
          badgeType: 'Explorer' // Determine dynamically from mission metadata if needed
        }, null); // authoritySigner parameter was removed from usage but exists in signature
      } catch (metaplexErr) {
        console.error('[Indexer] Metaplex Integration Error:', metaplexErr);
      }

    } catch (error) {
      console.error('[Indexer] Error handling reward claim:', error);
    }
  }

  /**
   * Increment a user stat
   */
  private async incrementUserStat(
    walletAddress: string,
    field: string,
    amount: number = 1
  ): Promise<void> {
    try {
      const { data: existing } = await this.supabase
        .from('user_stats')
        .select(field)
        .eq('wallet_address', walletAddress)
        .single();

      if (existing) {
        await this.supabase
          .from('user_stats')
          .update({
            [field]: (existing[field] || 0) + amount,
            last_active_at: new Date().toISOString(),
          })
          .eq('wallet_address', walletAddress);
      } else {
        await this.supabase.from('user_stats').insert({
          wallet_address: walletAddress,
          [field]: amount,
          total_missions_completed: field === 'total_missions_completed' ? amount : 0,
          total_points: field === 'total_points' ? amount : 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
        });
      }
    } catch (error) {
      console.error('[Indexer] Error incrementing user stat:', error);
    }
  }

  /**
   * Sync all historical missions from the blockchain
   */
  async syncHistoricalMissions(): Promise<number> {
    console.log('[Indexer] Syncing historical missions...');
    console.log('[Indexer] Historical sync not implemented - requires indexer API');
    return 0;
  }
}

/**
 * Factory function to create an indexer from env vars
 */
export function createIndexer(): AnchorIndexer {
  const config: IndexerConfig = {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };

  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return new AnchorIndexer(config);
}