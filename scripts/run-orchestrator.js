/**
 * DeFi Quest Engine - Full Integration Demo (Option B)
 */

const path = require('path');
const fs = require('fs');

// Hardcoded config for demo (can use .env.local too)
const CONFIG = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  supabaseUrl: 'https://bhkfvfoyhisyarocqciw.supabase.co',
  supabaseKey: 'sb_publishable_hpt7vy2vqx77NcYQfnyLkg_-28--MAK',
};

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const corePath = path.join(projectRoot, 'packages', 'core', 'dist', 'QuestOrchestrator');
  
  const { QuestOrchestrator, createOrchestrator } = require(corePath);
  const { Keypair } = require('@solana/web3.js');

  function loadAuthority() {
    const keypairPath = path.join(projectRoot, 'authority.json');
    
    try {
      if (fs.existsSync(keypairPath)) {
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        const secretKey = new Uint8Array(keypairData);
        return Keypair.fromSecretKey(secretKey);
      }
    } catch (e) {
      console.warn('Failed to load keypair:', e.message);
    }
    
    console.warn('Using generated keypair - NOT FOR PRODUCTION!');
    return Keypair.generate();
  }

  console.log('\n============================================================');
  console.log('  DeFi Quest Engine - Option B: Full On-Chain Integration');
  console.log('============================================================\n');

  const authority = loadAuthority();
  console.log('Authority:', authority.publicKey.toBase58());
  console.log('');

  console.log('[1] Creating QuestOrchestrator...');
  
  let orchestrator;
  try {
    // Override config with our values
    process.env.SOLANA_RPC_URL = CONFIG.rpcUrl;
    process.env.NEXT_PUBLIC_SUPABASE_URL = CONFIG.supabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = CONFIG.supabaseKey;
    
    orchestrator = await createOrchestrator(authority);
  } catch (error) {
    console.error('Failed to create orchestrator:', error.message);
    return;
  }

  console.log('[2] Starting orchestrator (indexer)...');
  await orchestrator.start();
  console.log('');

  const isInitialized = await orchestrator.isProgramInitialized();
  if (!isInitialized) {
    console.log('[3] Initializing Anchor program...');
    try {
      const initSig = await orchestrator.initializeProgram();
      console.log('   Program initialized! TX:', initSig);
    } catch (error) {
      console.log('   Note:', error.message);
    }
  } else {
    console.log('[3] Anchor program already initialized');
  }
  console.log('');

  console.log('============================================================');
  console.log('  BRIDGE 1: OverseerAI -> Anchor (register_mission)');
  console.log('============================================================');
  
  const mission1 = await orchestrator.createMission(5, 'degen');
  console.log('');
  console.log('  Generated Mission:');
  console.log('    ID:         ', mission1.mission.id);
  console.log('    Name:       ', mission1.mission.name);
  console.log('    Type:       ', mission1.mission.type);
  console.log('    Difficulty: ', mission1.mission.difficulty);
  console.log('');
  console.log('  On-Chain Registration:');
  console.log('    TX:', mission1.signature || '(local only)');
  console.log('    Status:', mission1.signature ? 'ON-CHAIN' : 'LOCAL ONLY');
  console.log('');

  console.log('  Creating batch of missions...');
  const missions = await orchestrator.createMissions(3, 10, 'strategist');
  console.log('  Created', missions.length, 'missions');
  missions.forEach((m, i) => {
    console.log(`    ${i+1}. ${m.mission.name} (${m.mission.type}) - ${m.signature ? 'ON-CHAIN' : 'LOCAL'}`);
  });
  console.log('');

  console.log('============================================================');
  console.log('  BRIDGE 2: SwapExecutor -> Anchor (submit_proof)');
  console.log('============================================================');
  
  const userWallet = Keypair.generate();
  console.log('  User Wallet:', userWallet.publicKey.toBase58());
  console.log('');

  const swapResult = await orchestrator.executeMissionSwap(
    {
      inputToken: 'SOL',
      outputToken: 'USDC',
      amount: 0.001,
      slippageBps: 50,
    },
    userWallet,
    mission1.mission.id
  );
  
  console.log('  Swap Result:');
  console.log('    Success:', swapResult.swap?.success ? 'YES' : 'NO');
  console.log('    TX:', swapResult.swap?.signature || '(failed)');
  console.log('');
  console.log('  Proof Submission:');
  console.log('    TX:', swapResult.proofSignature || '(local only)');
  console.log('    Status:', swapResult.proofSignature ? 'ON-CHAIN' : 'LOCAL');
  console.log('');

  console.log('============================================================');
  console.log('  BRIDGE 3: Anchor -> Supabase (Indexer)');
  console.log('============================================================');
  console.log('');
  console.log('  Indexer watching for events...');
  console.log('  Events sync to Supabase -> Dashboard shows data!');
  console.log('');

  console.log('============================================================');
  console.log('  Stats');
  console.log('============================================================');
  const stats = orchestrator.getStats();
  console.log('  Missions Generated:', stats.missionsGenerated);
  console.log('  Missions Registered:', stats.missionsRegistered);
  console.log('  Swaps Executed:    ', stats.swapsExecuted);
  console.log('  Proofs Submitted: ', stats.proofsSubmitted);
  console.log('');

  console.log('Stopping orchestrator...');
  await orchestrator.stop();

  console.log('\nDemo Complete!\n');
}

main().catch(console.error);