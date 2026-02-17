import { Connection } from '@solana/web3.js';
import { AutonomousSwarm } from '../src/AutonomousSwarm';

const SOLANA_RPC = 'http://localhost:8899'; // Local validator
const connection = new Connection(SOLANA_RPC, 'confirmed');

async function main() {
    console.log('--- DeFi Quest Engine: LOCAL AI SWARM DEMO (Ollama) ---');
    console.log('Powering agents with llama3.2 locally...');

    const swarm = new AutonomousSwarm(connection, 'llama3.2');

    // Add agents with distinct personalities
    await swarm.addAgent('Degen Dave');
    await swarm.addAgent('Conservative Carol');
    await swarm.addAgent('Whale William');

    console.log('\n--- Funding Agents (Localnet Airdrop) ---');
    for (const agent of (swarm as any).agents) {
        await swarm.fundAgent(agent, 5);
    }

    console.log('\n--- Swarm Activity Starting ---');
    swarm.start();

    // Run for a bit and show stats
    setTimeout(() => {
        console.log('\n--- Swarm Statistics Checkpoint ---');
        swarm.printStats();

        console.log('\nStopping swarm...');
        swarm.stop();
        process.exit(0);
    }, 60000); // Run for 1 minute
}

main().catch(e => {
    console.error('Demo Error:', e);
    console.log('\nHELP: Ensure Ollama is running and Llama 3.2 is pulled:');
    console.log('  ollama run llama3.2');
});
