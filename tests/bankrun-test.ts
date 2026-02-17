import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DefiQuest } from "../target/types/defi_quest";
import { expect } from "chai";
import { startAnchor, BankrunProvider } from "anchor-bankrun";
import { PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import BN from "bn.js";

describe("defi-quest-bankrun", () => {
    it("Executes mission flows in sub-seconds using Bankrun", async () => {
        // Start Bankrun with the program
        // This will load the program from target/deploy/defi_quest.so
        const context = await startAnchor(
            ".", // project root
            [],  // extra accounts
            []   // programs to load manually
        );

        console.log("Bankrun context started.");
        const bankrunProvider = new BankrunProvider(context);
        console.log("BankrunProvider established.");

        const idl = JSON.parse(
            readFileSync("./target/idl/defi_quest.json", "utf8")
        );
        const program = new Program<DefiQuest>(idl, bankrunProvider);
        const authority = bankrunProvider.wallet;

        // 1. Initialize
        const [configPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
        );

        console.log("Initializing quest engine...");
        await program.methods
            .initialize()
            .accounts({
                config: configPDA,
                authority: authority.publicKey,
            })
            .rpc();

        const config = await program.account.config.fetch(configPDA);
        expect(config.authority.toString()).to.equal(authority.publicKey.toString());
        expect(config.missionCount.toNumber()).to.equal(0);

        // 2. Register Mission
        const missionId = "swap_sol_usdc";
        const [missionPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("mission"), Buffer.from(missionId)],
            program.programId
        );

        console.log("Registering first mission...");
        await program.methods
            .registerMission(
                missionId,
                { swap: {} },
                {
                    inputToken: null,
                    outputToken: null,
                    minAmount: new BN(1_000_000_000),
                    targetVolume: null,
                    streakDays: null,
                },
                {
                    xp: new BN(100),
                    badgeType: "FIRST_SWAP",
                    tokenMint: null,
                    tokenAmount: null,
                },
                "https://api.jup.ag/v6/quote"
            )
            .accounts({
                mission: missionPDA,
                config: configPDA,
                authority: authority.publicKey,
            })
            .rpc();

        const mission = await program.account.mission.fetch(missionPDA);
        expect(mission.missionId).to.equal(missionId);
        expect(mission.active).to.be.true;

        // 3. Start Mission
        const user = Keypair.generate();
        const [progressPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("progress"), user.publicKey.toBuffer(), missionPDA.toBuffer()],
            program.programId
        );

        console.log("Funding user account...");
        // Fund user with 1 SOL
        await bankrunProvider.sendAndConfirm(
            new anchor.web3.Transaction().add(
                anchor.web3.SystemProgram.transfer({
                    fromPubkey: authority.publicKey,
                    toPubkey: user.publicKey,
                    lamports: 1_000_000_000,
                })
            )
        );

        console.log("Starting mission for user...");
        await program.methods
            .startMission()
            .accounts({
                progress: progressPDA,
                mission: missionPDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        const progressBefore = await program.account.userProgress.fetch(progressPDA);
        expect(progressBefore.completed).to.be.false;

        // 4. Submit Proof
        const mockSignature = "5" + "x".repeat(87);
        const SOL = new PublicKey("So11111111111111111111111111111111111111112");
        const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

        console.log("Submitting proof...");
        await program.methods
            .submitProof(mockSignature, new BN(2_000_000_000), SOL, USDC)
            .accounts({
                progress: progressPDA,
                mission: missionPDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        const progressAfter = await program.account.userProgress.fetch(progressPDA);
        expect(progressAfter.completed).to.be.true;
        expect(progressAfter.swapSignatures).to.have.lengthOf(1);

        console.log("✅ Bankrun test suite passed in sub-seconds!");
    });
});
