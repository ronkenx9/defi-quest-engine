import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DefiQuest } from "../target/types/defi_quest";
import { expect } from "chai";

describe("defi-quest", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.DefiQuest as Program<DefiQuest>;
    const authority = provider.wallet as anchor.Wallet;

    it("Initializes the quest engine", async () => {
        const [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
        );

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
    });

    it("Registers a new mission", async () => {
        const missionId = "first_swap";
        const [missionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("mission"), Buffer.from(missionId)],
            program.programId
        );

        const [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
        );

        await program.methods
            .registerMission(
                missionId,
                { swap: {} },
                {
                    inputToken: null,
                    outputToken: null,
                    minAmount: new anchor.BN(1_000_000_000),
                    targetVolume: null,
                    streakDays: null,
                },
                {
                    xp: new anchor.BN(100),
                    badgeType: "FIRST_SWAP",
                    tokenMint: null,
                    tokenAmount: null,
                },
                "https://example.com/mission/first_swap.json"
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
        expect(mission.reward.xp.toNumber()).to.equal(100);
    });

    it("Starts a mission", async () => {
        const user = anchor.web3.Keypair.generate();
        const missionId = "first_swap";

        // Airdrop SOL to user
        const signature = await provider.connection.requestAirdrop(user.publicKey, 2_000_000_000);
        await provider.connection.confirmTransaction(signature);

        const [missionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("mission"), Buffer.from(missionId)],
            program.programId
        );

        const [progressPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("progress"), user.publicKey.toBuffer(), missionPDA.toBuffer()],
            program.programId
        );

        await program.methods
            .startMission()
            .accounts({
                progress: progressPDA,
                mission: missionPDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        const progress = await program.account.userProgress.fetch(progressPDA);
        expect(progress.completed).to.be.false;
        expect(progress.user.toString()).to.equal(user.publicKey.toString());
    });

    it("Submits proof and completes mission", async () => {
        const user = anchor.web3.Keypair.generate();
        const missionId = "first_swap";

        const signature = await provider.connection.requestAirdrop(user.publicKey, 2_000_000_000);
        await provider.connection.confirmTransaction(signature);

        const [missionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("mission"), Buffer.from(missionId)],
            program.programId
        );

        const [progressPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("progress"), user.publicKey.toBuffer(), missionPDA.toBuffer()],
            program.programId
        );

        // Start mission first
        await program.methods
            .startMission()
            .accounts({
                progress: progressPDA,
                mission: missionPDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        // Submit proof (mock swap signature)
        const mockSignature = "5" + "x".repeat(87); // 88 char signature
        const SOL = new anchor.web3.PublicKey("So11111111111111111111111111111111111111112");
        const USDC = new anchor.web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

        await program.methods
            .submitProof(mockSignature, new anchor.BN(2_000_000_000), SOL, USDC)
            .accounts({
                progress: progressPDA,
                mission: missionPDA,
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        const progress = await program.account.userProgress.fetch(progressPDA);
        expect(progress.completed).to.be.true;
        expect(progress.swapSignatures).to.have.lengthOf(1);
    });
});
