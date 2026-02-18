/**
 * DeFi Quest Engine - Quest Orchestrator
 * Main integration class that ties together:
 * - OverseerAI (mission generation)
 * - Anchor Program (on-chain verification)
 * - Supabase (dashboard data)
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export interface OrchestratorConfig {
  rpcUrl: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  authorityKeypair: Keypair;
  idl?: any;
  supabaseUrl: string;
  supabaseKey: string;
  ollamaUrl?: string;
  personality?: 'strategos' | 'curator' | 'oracle';
}

export interface MissionRegistration {
  mission: any;
  signature: string;
  blockTime: number;
}

export interface SwapWithProof {
  swap: any;
  proofSignature?: string;
  missionId: string;
}

export interface OrchestratorStats {
  missionsGenerated: number;
  missionsRegistered: number;
  swapsExecuted: number;
  proofsSubmitted: number;
}

// Lazy imports to avoid circular deps
let AnchorQuestClient: any = null;
let AnchorIndexer: any = null;
let OverseerAI: any = null;
let SwapExecutor: any = null;
let OllamaClient: any = null;

function getAnchorImports() {
    if (!AnchorQuestClient) {
        try {
            const anchor = require('./anchor/AnchorClient');
            AnchorQuestClient = anchor.AnchorQuestClient;
        } catch (e) {
            console.warn('[Orchestrator] Anchor client not available:', e.message);
        }
    }
    return { AnchorQuestClient };
}

function getIndexerImports() {
    if (!AnchorIndexer) {
        try {
            const indexer = require('./anchor/Indexer');
            AnchorIndexer = indexer.AnchorIndexer;
        } catch (e) {
            console.warn('[Orchestrator] Indexer not available:', e.message);
        }
    }
    return { AnchorIndexer };
}

function getAIImports() {
    if (!OverseerAI || !SwapExecutor || !OllamaClient) {
        try {
            // Try workspace packages first
            const aiEngine = require('../ai-engine/src/index');
            OverseerAI = aiEngine.OverseerAI;
            SwapExecutor = aiEngine.SwapExecutor;
            OllamaClient = aiEngine.OllamaClient;
        } catch (e) {
            // Fallback - these are optional
            console.warn('[Orchestrator] AI Engine not available:', e.message);
        }
    }
    return { OverseerAI, SwapExecutor, OllamaClient };
}

export class QuestOrchestrator {
  private connection: Connection;
  private anchorClient: any = null;
  private indexer: any = null;
  private overseer: any = null;
  private swapExecutor: any = null;
  
  private config: OrchestratorConfig;
  private stats: OrchestratorStats = {
    missionsGenerated: 0,
    missionsRegistered: 0,
    swapsExecuted: 0,
    proofsSubmitted: 0,
  };

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, config.commitment || 'confirmed');
    
    // Get Anchor imports
    const { AnchorQuestClient: AQC } = getAnchorImports();
    if (AQC) {
        this.anchorClient = new AQC(this.connection, config.authorityKeypair, config.idl);
    }
    
    // Get Indexer imports
    const { AnchorIndexer: AI } = getIndexerImports();
    if (AI) {
        this.indexer = new AI({
            rpcUrl: config.rpcUrl,
            supabaseUrl: config.supabaseUrl,
            supabaseKey: config.supabaseKey,
            idl: config.idl,
        });
    }
    
    console.log('[Orchestrator] Initialized');
  }

  async start(): Promise<void> {
    console.log('[Orchestrator] Starting...');
    
    // Start indexer
    if (this.indexer) {
        await this.indexer.start();
    }
    
    // Initialize AI components if available
    const { OverseerAI: OAI, SwapExecutor: SE, OllamaClient: OC } = getAIImports();
    
    if (OAI && OC && this.anchorClient) {
        const ollamaClient = new OC({ 
            baseUrl: this.config.ollamaUrl || 'http://localhost:11434' 
        });
        this.overseer = new OAI(ollamaClient, this.config.personality || 'curator');
        await this.overseer.initializeWithAnchor(
            this.connection,
            this.config.authorityKeypair,
            this.config.idl
        );
        
        this.swapExecutor = new SE(this.connection);
        await this.swapExecutor.initializeWithAnchor(
            this.config.authorityKeypair,
            this.config.idl
        );
    }
    
    console.log('[Orchestrator] Started successfully');
  }

  async stop(): Promise<void> {
    if (this.indexer) {
        await this.indexer.stop();
    }
    console.log('[Orchestrator] Stopped');
  }

  async createMission(
    playerLevel: number,
    playerStyle: string
  ): Promise<MissionRegistration> {
    console.log(`[Orchestrator] Creating mission for level ${playerLevel} ${playerStyle} player`);
    
    if (this.overseer) {
        const { mission, signature } = await this.overseer.generateAndRegisterMission(
            playerLevel,
            playerStyle
        );
        
        this.stats.missionsGenerated++;
        if (signature) {
            this.stats.missionsRegistered++;
        }
        
        return {
            mission,
            signature,
            blockTime: Date.now(),
        };
    }
    
    // Fallback - create local mission without Anchor
    this.stats.missionsGenerated++;
    const mission = {
        id: `quest_${Date.now()}`,
        name: 'Generated Quest',
        type: 'swap',
        difficulty: 'medium',
        requirements: {},
        reward: { xp: playerLevel * 100 },
    };
    
    return {
        mission,
        signature: '',
        blockTime: Date.now(),
    };
  }

  async createMissions(
    count: number,
    playerLevel: number,
    playerStyle: string
  ): Promise<MissionRegistration[]> {
    const results: MissionRegistration[] = [];
    
    for (let i = 0; i < count; i++) {
        const result = await this.createMission(playerLevel, playerStyle);
        results.push(result);
        if (i < count - 1) await new Promise(r => setTimeout(r, 500));
    }
    
    return results;
  }

  async executeMissionSwap(
    params: any,
    userKeypair: Keypair,
    missionId: string
  ): Promise<SwapWithProof> {
    console.log(`[Orchestrator] Executing swap for mission: ${missionId}`);
    
    if (this.swapExecutor) {
        const result = await this.swapExecutor.swapAndSubmitProof(
            params,
            userKeypair,
            missionId
        );
        
        this.stats.swapsExecuted++;
        if (result.proofSignature) {
            this.stats.proofsSubmitted++;
        }
        
        return {
            ...result,
            missionId,
        };
    }
    
    // Fallback - just do the swap
    this.stats.swapsExecuted++;
    return {
        swap: { success: false, signature: '', inputAmount: 0, outputAmount: 0, priceImpact: 0 },
        missionId,
    };
  }

  getStats(): OrchestratorStats {
    return { ...this.stats };
  }

  getAnchorClient(): any {
    return this.anchorClient;
  }

  getIndexer(): any {
    return this.indexer;
  }

  async isProgramInitialized(): Promise<boolean> {
    if (!this.anchorClient) return false;
    try {
        const config = await this.anchorClient.getConfig();
        return config !== null;
    } catch {
        return false;
    }
  }

  async initializeProgram(): Promise<string> {
    if (!this.anchorClient) {
        throw new Error('Anchor client not initialized');
    }
    const isInitialized = await this.isProgramInitialized();
    if (isInitialized) {
        console.log('[Orchestrator] Program already initialized');
        return '';
    }
    
    console.log('[Orchestrator] Initializing Anchor program...');
    return await this.anchorClient.initialize();
  }
}

export async function createOrchestrator(
  authorityKeypair: Keypair
): Promise<QuestOrchestrator> {
  const config: OrchestratorConfig = {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    authorityKeypair,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    personality: (process.env.AI_PERSONALITY as any) || 'curator',
  };

  let idl: any;
  try {
    idl = require('../../target/idl/defi_quest.json');
    config.idl = idl;
    console.log('[Orchestrator] Loaded IDL from target/idl');
  } catch {
    console.warn('[Orchestrator] No IDL found, using generated client');
  }

  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return new QuestOrchestrator(config);
}