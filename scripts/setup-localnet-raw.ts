/**
 * DeFi Quest Engine - Localnet Setup Script (Raw Web3.js Version)
 * 
 * This script initializes the Anchor program on localnet and seeds it with
 * starter missions using raw transactions to avoid Anchor SDK versioning issues.
 */

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    SystemProgram
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

// Configuration
const LOCALNET_URL = 'http://localhost:8899';
const PROGRAM_ID = new PublicKey('CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp');

// Instruction Discriminators
const INITIALIZE_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
const REGISTER_MISSION_DISCRIMINATOR = Buffer.from([219, 46, 41, 229, 151, 222, 229, 86]);

// PDA Helpers
function getConfigPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
    );
    return pda;
}

function getMissionPda(missionId: string): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('mission'), Buffer.from(missionId)],
        PROGRAM_ID
    );
    return pda;
}

// Simple Borsh-like encoder for mission data
function encodeRegisterMission(
    missionId: string,
    missionType: string,
    minAmount: number,
    xp: number,
    badge: string,
    metadataUri: string
): Buffer {
    let buffers: Buffer[] = [REGISTER_MISSION_DISCRIMINATOR];

    // 1. missionId (string)
    const idBuf = Buffer.from(missionId);
    const idLen = Buffer.alloc(4);
    idLen.writeUInt32LE(idBuf.length);
    buffers.push(idLen, idBuf);

    // 2. missionType (Enum)
    // 0: Swap, 1: Volume, 2: Streak, 3: DCA, 4: Prediction, 5: Staking
    const typeMap: Record<string, number> = {
        'swap': 0, 'volume': 1, 'streak': 2, 'dca': 3, 'prediction': 4, 'staking': 5
    };
    const typeByte = Buffer.alloc(1);
    typeByte.writeUInt8(typeMap[missionType] || 0);
    buffers.push(typeByte);

    // 3. MissionRequirement (Struct)
    // inputToken: Option<Pubkey> (0 = None)
    buffers.push(Buffer.from([0]));
    // outputToken: Option<Pubkey> (0 = None)
    buffers.push(Buffer.from([0]));
    // minAmount (u64)
    const amountBuf = Buffer.alloc(8);
    amountBuf.writeBigUInt64LE(BigInt(Math.floor(minAmount * 1e9)));
    buffers.push(amountBuf);
    // targetVolume: Option<u64> (if volume, set value)
    if (missionType === 'volume') {
        buffers.push(Buffer.from([1])); // Some
        const volBuf = Buffer.alloc(8);
        volBuf.writeBigUInt64LE(BigInt(Math.floor(minAmount * 1e9)));
        buffers.push(volBuf);
    } else {
        buffers.push(Buffer.from([0])); // None
    }
    // streakDays: Option<u8> (None)
    buffers.push(Buffer.from([0]));

    // 4. MissionReward (Struct)
    // xp (u64)
    const xpBuf = Buffer.alloc(8);
    xpBuf.writeBigUInt64LE(BigInt(xp));
    buffers.push(xpBuf);
    // badgeType: Option<string>
    if (badge) {
        buffers.push(Buffer.from([1])); // Some
        const badgeBuf = Buffer.from(badge);
        const badgeLen = Buffer.alloc(4);
        badgeLen.writeUInt32LE(badgeBuf.length);
        buffers.push(badgeLen, badgeBuf);
    } else {
        buffers.push(Buffer.from([0])); // None
    }
    // tokenMint: Option<Pubkey> (None)
    buffers.push(Buffer.from([0]));
    // tokenAmount: Option<u64> (None)
    buffers.push(Buffer.from([0]));

    // 5. metadataUri (string)
    const uriBuf = Buffer.from(metadataUri);
    const uriLen = Buffer.alloc(4);
    uriLen.writeUInt32LE(uriBuf.length);
    buffers.push(uriLen, uriBuf);

    return Buffer.concat(buffers);
}

async function run() {
    console.log('\n?? DeFi Quest Engine - Localnet Setup (Raw)\n');

    // Connect to localnet
    const connection = new Connection(LOCALNET_URL, 'confirmed');

    // Load authority (try multiple paths for WSL/Windows compatibility)
    const possiblePaths = [
        path.join(__dirname, '../authority.json'),
        path.join(process.cwd(), 'authority.json'),
        '/home/tega/.config/solana/id.json',
    ];

    let keyPath = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            keyPath = p;
            break;
        }
    }

    if (!keyPath) {
        throw new Error(`Could not find authority wallet at any of: ${possiblePaths.join(', ')}`);
    }

    const authority = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keyPath, 'utf8'))));
    console.log(`?? Authority: ${authority.publicKey.toString()}`);

    // Step 1: Initialize
    console.log('\n?? Step 1: Initialize Quest Engine...');
    const configPda = getConfigPda();
    const configData = await connection.getAccountInfo(configPda);

    if (configData) {
        console.log('   ? Already initialized');
    } else {
        const initIx = new TransactionInstruction({
            keys: [
                { pubkey: configPda, isSigner: false, isWritable: true },
                { pubkey: authority.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data: INITIALIZE_DISCRIMINATOR,
        });

        const tx = new Transaction().add(initIx);
        const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
        console.log(`   ? Initialized! TX: ${sig.slice(0, 20)}...`);
    }

    // Step 2: Register Missions
    const missions = [
        { id: 'first_swap', name: 'First Swap', type: 'swap', amount: 0.01, xp: 100, badge: 'FIRST_SWAP' },
        { id: 'volume_rookie', name: 'Volume Rookie', type: 'volume', amount: 0.1, xp: 250, badge: 'VOLUME_ROOKIE' },
        { id: 'degen_trader', name: 'Degen Trader', type: 'swap', amount: 0.5, xp: 500, badge: 'DEGEN' },
        { id: 'whale_in_training', name: 'Whale in Training', type: 'volume', amount: 2.0, xp: 1000, badge: 'WHALE' },
        { id: 'first_prediction', name: 'Oracle Apprentice', type: 'prediction', amount: 10.0, xp: 750, badge: 'ORACLE' },
        { id: 'first_stake', name: 'Network Defender', type: 'staking', amount: 1.0, xp: 1500, badge: 'DEFENDER' },
    ];

    console.log('\n?? Step 2: Register Missions...');
    for (const m of missions) {
        const missionPda = getMissionPda(m.id);
        const missionData = await connection.getAccountInfo(missionPda);

        if (missionData) {
            console.log(`   ??  ${m.name} - already registered`);
            continue;
        }

        const data = encodeRegisterMission(m.id, m.type, m.amount, m.xp, m.badge, `https://quest.defi/m/${m.id}`);
        const regIx = new TransactionInstruction({
            keys: [
                { pubkey: missionPda, isSigner: false, isWritable: true },
                { pubkey: configPda, isSigner: false, isWritable: true }, // Changed to true
                { pubkey: authority.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId: PROGRAM_ID,
            data: data,
        });

        const tx = new Transaction().add(regIx);
        const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
        console.log(`   ? Registered ${m.name}! TX: ${sig.slice(0, 20)}...`);
    }

    console.log('\n?? Setup Complete!\n');
}

run().catch(console.error);
