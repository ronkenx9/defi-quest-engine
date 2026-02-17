const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

const kp = Keypair.generate();
const path = 'target/deploy/defi_quest-keypair.json';

fs.writeFileSync(path, JSON.stringify(Array.from(kp.secretKey)));
console.log(kp.publicKey.toBase58());
