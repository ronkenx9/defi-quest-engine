/**
 * DeFi Quest Engine - Integration Demo
 * Shows how the 3 systems connect:
 * 1. OverseerAI → Anchor (register_mission)
 * 2. SwapExecutor → Anchor (submit_proof)  
 * 3. Anchor → Supabase (Indexer)
 * 
 * Run: npx ts-node scripts/demo-integration.ts
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorQuestClient, AnchorIndexer, createIndexer } from '@defi-quest/core';
import { OverseerAI } from './packages/ai-engine/src/OverseerAI';
import { SwapExecutor } from './packages/ai-engine/src/SwapExecutor';
import { OllamaClient } from './packages/ai-engine/src/OllamaClient';

// Configuration - replace with your values
const CONFIG = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
  // Authority wallet (needs to be imported from file or env)
  authorityPath: process.env.AUTHORITY_KEYPAIR || '~/.config/solana/id.json',
};

/**
 * Demo: Full data flow
 */
async function demoFullFlow() {
  console.log('\n========== DeFi Quest Engine - Integration Demo ==========\n');
  
  // 1. Setup connections
  const connection = new Connection(CONFIG.rpcUrl, 'confirmed');
  
  // Load authority wallet (in real app, use proper keypair loading)
  const authority = Keypair.generate(); // Demo - use real keypair in production
  
  console.log('[1] Connections initialized');
  console.log(`    Authority: ${authority.publicKey.toBase58()}`);
  
  // 2. Initialize Anchor Client
  // Note: In production, load the IDL from target/idl/defi_quest.json
  // const idl = require('./target/idl/defi_quest.json');
  const anchorClient = new AnchorQuestClient(connection, authority);
  
  console.log('[2] Anchor client initialized');
  
  // 3. BRIDGE 1: OverseerAI → Anchor
  // ================================
  console.log('\n--- BRIDGE 1: OverseerAI → Anchor ---');
  
  // Setup OverseerAI
  const ollamaClient = new OllamaClient({ baseUrl: 'http://localhost:11434' });
  const overseer = new OverseerAI(ollamaClient, 'curator');
  
  // Generate and register mission on-chain
  const { mission, signature } = await overseer.generateAndRegisterMission(
    5, // player level
    'degen' // player style
  );
  
  console.log(`Generated mission: ${mission.name}`);
  console.log(`Mission ID: ${mission.id}`);
  console.log(`Registered on-chain: ${signature ? 'YES' : 'NO (no Anchor client)'}`);
  if (signature) console.log(`TX Signature: ${signature}`);
  
  // 4. BRIDGE 2: SwapExecutor → Anchor
  // ====================================
  console.log('\n--- BRIDGE 2: SwapExecutor → Anchor ---');
  
  const swapExecutor = new SwapExecutor(connection);
  
  // Execute swap and submit proof
  const userWallet = Keypair.generate(); // Demo user
  const swapResult = await swapExecutor.swapAndSubmitProof(
    {
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 0.1,
    },
    userWallet,
    mission.id // Link to mission
  );
  
  console.log(`Swap success: ${swapResult.swap.success}`);
  console.log(`Signature: ${swapResult.swap.signature}`);
  console.log(`Proof submitted: ${swapResult.proofSignature ? 'YES' : 'NO'}`);
  if (swapResult.proofSignature) {
    console.log(`Proof TX: ${swapResult.proofSignature}`);
  }
  
  // 5. BRIDGE 3: Anchor → Supabase (Indexer)
  // ==========================================
  console.log('\n--- BRIDGE 3: Anchor → Supabase ---');
  
  // Start the indexer (watches for events)
  const indexer = createIndexer();
  await indexer.start();
  console.log('Indexer started - watching for on-chain events');
  
  // In a real scenario:
  // - Overseer registers mission → Indexer catches MissionRegisteredEvent → Writes to Supabase
  // - Agent starts mission → Indexer catches MissionStartedEvent → Updates Supabase  
  // - Agent submits proof → Indexer catches MissionCompletedEvent → Updates Supabase
  // - Agent claims reward → Indexer catches RewardClaimedEvent → Updates Supabase
  
  console.log('\n[DEMO] In production, the flow is:');
  console.log('  1. OverseerAI.registerMission() → Solana blockchain');
  console.log('  2. Indexer sees MissionRegisteredEvent → Writes to Supabase');
  console.log('  3. Dashboard reads from Supabase → Shows REAL missions!');
  console.log('  4. Agent does swap → submitProof() on Anchor');
  console.log('  5. Indexer sees MissionCompletedEvent → Updates Supabase');
  console.log('  6. Dashboard shows completed mission!');
  
  // Cleanup
  await indexer.stop();
  
  console.log('\n========== Demo Complete ==========\n');
}

// Run if executed directly
demoFullFlow().catch(console.error);