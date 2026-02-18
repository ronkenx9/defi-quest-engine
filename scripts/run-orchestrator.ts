/**
 * DeFi Quest Engine - Full Integration Demo (Option B)
 * 
 * This demonstrates the complete data flow:
 * 1. OverseerAI generates mission → Anchor.register_mission()
 * 2. Agent executes swap → Anchor.submit_proof()
 * 3. Indexer watches events → Supabase sync
 * 4. Dashboard reads Supabase → Shows real on-chain data!
 * 
 * Usage:
 *   npx ts-node scripts/run-orchestrator.ts
 * 
 * Environment vars needed:
 *   SOLANA_RPC_URL=https://api.devnet.solana.com
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
 *   AUTHORITY_KEYPAIR="[1,2,3,...]" (array of numbers from solana-keygen)
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { QuestOrchestrator, createOrchestrator } from '../packages/core/src/QuestOrchestrator';

// Demo configuration
const DEMO_CONFIG = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhkfvfoyhisyarocqciw.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_hpt7vy2vqx77NcYQfnyLkg_-28--MAK',
};

/**
 * Load authority keypair from various sources
 */
function loadAuthority(): Keypair {
  // Option 1: From environment variable (JSON string)
  const keypairEnv = process.env.AUTHORITY_KEYPAIR;
  if (keypairEnv) {
    try {
      const secretKey = JSON.parse(keypairEnv);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (e) {
      console.warn('Failed to parse AUTHORITY_KEYPAIR, generating new keypair');
    }
  }

  // Option 2: From file path
  const keypairPath = process.env.AUTHORITY_KEYPAIR_PATH;
  if (keypairPath) {
    try {
      const fs = require('fs');
      const keypairData = fs.readFileSync(keypairPath);
      const secretKey = JSON.parse(keypairData);
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (e) {
      console.warn('Failed to load keypair from file, generating new keypair');
    }
  }

  // Fallback: Generate demo keypair (NOT FOR PRODUCTION)
  console.warn('⚠️  Using generated keypair - NOT FOR PRODUCTION!');
  return Keypair.generate();
}

/**
 * Demo: Full orchestrator flow
 */
async function runDemo() {
  console.log('\n' + '='.repeat(60));
  console.log('  DeFi Quest Engine - Option B: Full On-Chain Integration');
  console.log('='.repeat(60) + '\n');

  // Load authority
  const authority = loadAuthority();
  console.log('Authority:', authority.publicKey.toBase58());
  console.log('');

  // Create orchestrator
  console.log('[1] Creating QuestOrchestrator...');
  
  let orchestrator: QuestOrchestrator;
  try {
    orchestrator = await createOrchestrator(authority);
  } catch (error: any) {
    console.error('Failed to create orchestrator:', error.message);
    console.log('\nMake sure you have:');
    console.log('  - SOLANA_RPC_URL set');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL set');
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY set');
    console.log('  - AUTHORITY_KEYPAIR or AUTHORITY_KEYPAIR_PATH set\n');
    return;
  }

  // Start orchestrator
  console.log('[2] Starting orchestrator (indexer)...');
  await orchestrator.start();
  console.log('');

  // Check if program is initialized
  const isInitialized = await orchestrator.isProgramInitialized();
  if (!isInitialized) {
    console.log('[3] Initializing Anchor program...');
    try {
      const initSig = await orchestrator.initializeProgram();
      console.log('   Program initialized! TX:', initSig);
    } catch (error: any) {
      console.log('   Note:', error.message);
    }
  } else {
    console.log('[3] Anchor program already initialized');
  }
  console.log('');

  // BRIDGE 1: Generate and register mission on-chain
  console.log('='.repeat(60));
  console.log('  BRIDGE 1: OverseerAI → Anchor (register_mission)');
  console.log('='.repeat(60));
  
  const mission1 = await orchestrator.createMission(5, 'degen');
  console.log('');
  console.log('  Generated Mission:');
  console.log('    ID:         ', mission1.mission.id);
  console.log('    Name:       ', mission1.mission.name);
  console.log('    Type:       ', mission1.mission.type);
  console.log('    Difficulty: ', mission1.mission.difficulty);
  console.log('    Reward XP:  ', mission1.mission.reward.xp);
  console.log('');
  console.log('  On-Chain Registration:');
  console.log('    TX Signature:', mission1.signature || '(no Anchor client - local only)');
  console.log('    Status:     ', mission1.signature ? '✅ ON-CHAIN' : '⚠️  LOCAL ONLY');
  console.log('');

  // Create more missions
  console.log('  Creating batch of missions...');
  const missions = await orchestrator.createMissions(3, 10, 'strategist');
  console.log(`  Created ${missions.length} missions`);
  missions.forEach((m, i) => {
    console.log(`    ${i+1}. ${m.mission.name} (${m.mission.type}) - ${m.signature ? '✅' : '⚠️'}`);
  });
  console.log('');

  // BRIDGE 2: Execute swap and submit proof
  console.log('='.repeat(60));
  console.log('  BRIDGE 2: SwapExecutor → Anchor (submit_proof)');
  console.log('='.repeat(60));
  
  // Create a demo user wallet
  const userWallet = Keypair.generate();
  console.log('  User Wallet:', userWallet.publicKey.toBase58());
  console.log('');

  // Execute swap with proof
  const swapResult = await orchestrator.executeMissionSwap(
    {
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 0.1,
      slippageBps: 50,
    },
    userWallet,
    mission1.mission.id
  );
  
  console.log('  Swap Result:');
  console.log('    Success:     ', swapResult.swap.success ? '✅' : '❌');
  console.log('    Signature:   ', swapResult.swap.signature || '(failed)');
  console.log('    Input:       ', swapResult.swap.inputAmount, 'SOL');
  console.log('    Output:      ', swapResult.swap.outputAmount, 'USDC');
  console.log('');
  console.log('  Proof Submission:');
  console.log('    TX Signature:', swapResult.proofSignature || '(no Anchor client)');
  console.log('    Status:     ', swapResult.proofSignature ? '✅ VERIFIED ON-CHAIN' : '⚠️  LOCAL ONLY');
  console.log('');

  // BRIDGE 3: Indexer syncs to Supabase
  console.log('='.repeat(60));
  console.log('  BRIDGE 3: Anchor → Supabase (Indexer)');
  console.log('='.repeat(60));
  console.log('');
  console.log('  The indexer is now watching for on-chain events...');
  console.log('');
  console.log('  Event Flow:');
  console.log('    1. MissionRegistered → Indexer catches → Writes to Supabase');
  console.log('    2. MissionStarted     → Indexer catches → Updates Supabase');
  console.log('    3. MissionCompleted  → Indexer catches → Updates Supabase');
  console.log('    4. RewardClaimed     → Indexer catches → Updates Supabase');
  console.log('');
  console.log('  Dashboard reads from Supabase → Shows REAL on-chain data!');
  console.log('');

  // Stats
  console.log('='.repeat(60));
  console.log('  Orchestrator Stats');
  console.log('='.repeat(60));
  const stats = orchestrator.getStats();
  console.log('  Missions Generated:', stats.missionsGenerated);
  console.log('  Missions Registered:', stats.missionsRegistered);
  console.log('  Swaps Executed:    ', stats.swapsExecuted);
  console.log('  Proofs Submitted: ', stats.proofsSubmitted);
  console.log('');

  // Cleanup
  console.log('Stopping orchestrator...');
  await orchestrator.stop();

  console.log('\n' + '='.repeat(60));
  console.log('  Demo Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('  1. Configure AUTHORITY_KEYPAIR for real on-chain transactions');
  console.log('  2. Run the dashboard to see missions from Supabase');
  console.log('  3. Deploy the Anchor program to devnet/mainnet\n');
}

// Run
runDemo().catch(console.error);