/**
 * DeFi Quest Engine - Localnet Setup Script
 * 
 * This script initializes the Anchor program on localnet and seeds it with
 * starter missions. Run this after starting `solana-test-validator`.
 * 
 * Usage:
 *   npx tsx scripts/setup-localnet.ts
 * 
 * Prerequisites:
 *   1. Start local validator: solana-test-validator
 *   2. Build program: anchor build
 *   3. Deploy: anchor deploy --provider.cluster localnet
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

// Configuration
const LOCALNET_URL = 'http://localhost:8899';
const PROGRAM_ID = 'CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp';

// Load IDL
function loadIdl() {
  const idlPath = path.join(__dirname, '../target/idl/defi_quest.json');
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

    console.log('??  Aggressively patching IDL for SDK compatibility...');

    // 1. Force move layouts from types into accounts
    if (idl.accounts && idl.types) {
      idl.accounts = idl.accounts.map((acc: any) => {
        const typeDef = idl.types.find((t: any) => t.name === acc.name);
        if (typeDef && typeDef.type) {
          return {
            name: acc.name,
            type: typeDef.type // { kind: 'struct', fields: [...] }
          };
        }
        return acc;
      });
    }

    // 2. Hide spec from metadata
    if (idl.metadata) {
      delete idl.metadata.spec;
    }

    // 3. Strip to bare minimum instructions needed for seeding
    const essentialIxs = ['initialize', 'register_mission'];
    idl.instructions = idl.instructions.filter((ix: any) => essentialIxs.includes(ix.name));

    // 4. Strip to bare minimum accounts
    const essentialAccs = ['Config', 'Mission'];
    idl.accounts = idl.accounts.filter((acc: any) => essentialAccs.includes(acc.name));

    console.log('??  Minimal IDL for seeding prepared');

    return idl;
  }
  throw new Error(`IDL not found at ${idlPath}. Run 'anchor build' first.`);
}

// Load authority keypair
function loadAuthority(): Keypair {
  // Try to load from various locations
  const possiblePaths = [
    path.join(__dirname, '../authority.json'),
    path.join(process.env.HOME || '', '.config/solana/id.json'),
    path.join(process.env.USERPROFILE || '', '.config/solana/id.json'),
  ];

  for (const keyPath of possiblePaths) {
    if (fs.existsSync(keyPath)) {
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
      // Handle both array format and { secretKey: [...] } format
      const secretKey = keyData.secretKey || keyData;
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }
  }

  // Generate new keypair if none found
  console.log('??  No authority keypair found, generating new one...');
  const keypair = Keypair.generate();
  fs.writeFileSync(
    path.join(__dirname, '../authority.json'),
    JSON.stringify(Array.from(keypair.secretKey))
  );
  console.log(`   Saved to ${path.join(__dirname, '../authority.json')}`);
  console.log(`   PublicKey: ${keypair.publicKey.toString()}`);
  console.log('??  IMPORTANT: Add this key to your Anchor.toml wallet config');

  return keypair;
}

// Mission definitions
const missions = [
  {
    id: 'first_swap',
    name: 'First Swap',
    type: 'swap',
    minAmount: 0.01,      // SOL
    minAmountUsd: 2,       // ~$2 USD
    xp: 100,
    badge: 'FIRST_SWAP',
    description: 'Complete your first token swap',
  },
  {
    id: 'volume_rookie',
    name: 'Volume Rookie',
    type: 'volume',
    minAmount: 0.1,       // SOL
    minAmountUsd: 20,     // ~$20 USD
    xp: 250,
    badge: 'VOLUME_ROOKIE',
    description: 'Swap at least $20 in total volume',
  },
  {
    id: 'degen_trader',
    name: 'Degen Trader',
    type: 'swap',
    minAmount: 0.5,       // SOL
    minAmountUsd: 100,    // ~$100 USD
    xp: 500,
    badge: 'DEGEN',
    description: 'Complete a swap of 0.5+ SOL',
  },
  {
    id: 'whale_in_training',
    name: 'Whale in Training',
    type: 'volume',
    minAmount: 2,         // SOL
    minAmountUsd: 400,    // ~$400 USD
    xp: 1000,
    badge: 'WHALE',
    description: 'Reach $400 total swap volume',
  },
];

// Get PDA addresses
function getConfigPda(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  );
  return pda;
}

function getMissionPda(missionId: string, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('mission'), Buffer.from(missionId)],
    programId
  );
  return pda;
}

async function setup() {
  console.log('\n?? DeFi Quest Engine - Localnet Setup\n');
  console.log('='.repeat(50));

  // Connect to localnet
  const connection = new Connection(LOCALNET_URL, 'confirmed');
  console.log(`?? Connected to ${LOCALNET_URL}`);

  // Load authority and create provider
  const authority = loadAuthority();
  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  console.log(`?? Authority: ${authority.publicKey.toString()}`);

  // Load program
  const { Program } = require('@coral-xyz/anchor');
  const idl = loadIdl();
  const programId = new PublicKey(PROGRAM_ID);
  const program = new Program(idl, programId, provider);
  console.log(`?? Program ID: ${programId.toString()}`);

  // Check balance
  const balance = await connection.getBalance(authority.publicKey);
  console.log(`?? Authority balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

  if (balance < 1) {
    console.error('? ERROR: Authority wallet needs SOL for transactions.');
    console.error('   Run: solana airdrop 10 <your-wallet-address>\n');
    process.exit(1);
  }

  // Step 1: Initialize the program (if not already done)
  console.log('\n?? Step 1: Initialize Quest Engine...');
  try {
    const configPda = getConfigPda(programId);
    const existingConfig = await program.account.config.fetchNullable(configPda);

    if (existingConfig) {
      console.log('   ? Already initialized');
    } else {
      const tx = await program.methods
        .initialize()
        .accounts({
          config: configPda,
          authority: authority.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();
      console.log(`   ? Initialized! TX: ${tx.slice(0, 20)}...`);
    }
  } catch (error: any) {
    if (error.message?.includes('already in use')) {
      console.log('   ? Already initialized');
    } else {
      throw error;
    }
  }

  // Step 2: Register missions
  console.log('\n?? Step 2: Register Missions...');
  for (const mission of missions) {
    try {
      const missionPda = getMissionPda(mission.id, programId);

      // Check if mission already exists
      const existingMission = await program.account.mission.fetchNullable(missionPda);

      if (existingMission) {
        console.log(`   ??  ${mission.name} (${mission.id}) - already registered`);
        continue;
      }

      // Build requirement and reward objects
      const requirement = {
        inputToken: null,
        outputToken: null,
        minAmount: new (require('@coral-xyz/anchor').BN)(mission.minAmount * 1e9),
        targetVolume: mission.type === 'volume'
          ? new (require('@coral-xyz/anchor').BN)(mission.minAmount * 1e9)
          : null,
        streakDays: null,
      };

      const reward = {
        xp: new (require('@coral-xyz/anchor').BN)(mission.xp),
        badgeType: mission.badge,
        tokenMint: null,
        tokenAmount: null,
      };

      const tx = await program.methods
        .registerMission(
          mission.id,
          { [mission.type]: {} },
          requirement,
          reward,
          `https://defi-quest.com/missions/${mission.id}`
        )
        .accounts({
          mission: missionPda,
          config: getConfigPda(programId),
          authority: authority.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log(`   ? ${mission.name}`);
      console.log(`      ID: ${mission.id}`);
      console.log(`      XP: ${mission.xp} | Badge: ${mission.badge}`);
      console.log(`      PDA: ${missionPda.toString()}`);
      console.log(`      TX: ${tx.slice(0, 20)}...\n`);

    } catch (error: any) {
      console.error(`   ? Failed to register ${mission.name}:`, error.message);
    }
  }

  // Step 3: Summary
  console.log('\n' + '='.repeat(50));
  console.log('?? Setup Complete!\n');
  console.log('Next steps:');
  console.log('1. Update .env.local to use localnet RPC:');
  console.log('   NEXT_PUBLIC_SOLANA_RPC_URL=http://localhost:8899');
  console.log('2. Start frontend: npm run dev');
  console.log('3. Open http://localhost:3000\n');
  console.log('Starter Missions:');
  missions.forEach(m => {
    console.log(`   - ${m.name}: ${m.xp} XP + ${m.badge} badge`);
  });
  console.log('\n?? Program IDs:');
  console.log(`   Program: ${programId.toString()}`);
  console.log(`   Config:  ${getConfigPda(programId).toString()}`);
  console.log('');
}

// Run
setup().catch(console.error);
