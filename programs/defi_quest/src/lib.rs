use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp");

#[program]
pub mod defi_quest {
    use super::*;

    /// Initialize the quest program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.mission_count = 0;
        config.total_completions = 0;
        config.bump = ctx.bumps.config;
        
        msg!("Quest Engine initialized by {}", config.authority);
        Ok(())
    }

    /// Register a new mission
    pub fn register_mission(
        ctx: Context<RegisterMission>,
        mission_id: String,
        mission_type: MissionType,
        requirement: MissionRequirement,
        reward: MissionReward,
        metadata_uri: String,
    ) -> Result<()> {
        require!(mission_id.len() <= 32, ErrorCode::MissionIdTooLong);
        require!(metadata_uri.len() <= 200, ErrorCode::MetadataUriTooLong);
        
        let mission = &mut ctx.accounts.mission;
        let config = &mut ctx.accounts.config;
        
        mission.authority = ctx.accounts.authority.key();
        mission.mission_id = mission_id.clone();
        mission.mission_type = mission_type.clone();
        mission.requirement = requirement.clone();
        mission.reward = reward.clone();
        mission.metadata_uri = metadata_uri;
        mission.active = true;
        mission.completions = 0;
        mission.created_at = Clock::get()?.unix_timestamp;
        mission.bump = ctx.bumps.mission;
        
        config.mission_count += 1;
        
        emit!(MissionRegisteredEvent {
            mission: mission.key(),
            mission_id,
            mission_type,
            authority: mission.authority,
        });
        
        Ok(())
    }

    /// Start a mission for a user
    pub fn start_mission(ctx: Context<StartMission>) -> Result<()> {
        let progress = &mut ctx.accounts.progress;
        let mission = &ctx.accounts.mission;
        
        require!(mission.active, ErrorCode::MissionInactive);
        require!(!progress.completed, ErrorCode::AlreadyCompleted);
        
        progress.user = ctx.accounts.user.key();
        progress.mission = mission.key();
        progress.started_at = Clock::get()?.unix_timestamp;
        progress.current_value = 0;
        progress.completed = false;
        progress.completed_at = None;
        progress.claimed = false;
        progress.claimed_at = None;
        progress.swap_signatures = vec![];
        progress.bump = ctx.bumps.progress;
        
        emit!(MissionStartedEvent {
            user: progress.user,
            mission: mission.key(),
            started_at: progress.started_at,
        });
        
        Ok(())
    }

    /// Submit proof of mission completion (swap signature)
    pub fn submit_proof(
        ctx: Context<SubmitProof>,
        swap_signature: String,
        swap_amount: u64,
        input_token: Pubkey,
        output_token: Pubkey,
    ) -> Result<()> {
        let progress = &mut ctx.accounts.progress;
        let mission = &ctx.accounts.mission;
        
        require!(!progress.completed, ErrorCode::AlreadyCompleted);
        require!(mission.active, ErrorCode::MissionInactive);
        require!(swap_signature.len() == 88, ErrorCode::InvalidSignature);
        
        // Verify swap meets mission requirements
        match mission.mission_type {
            MissionType::Swap => {
                // Check tokens match
                if let Some(req_input) = mission.requirement.input_token {
                    require!(input_token == req_input, ErrorCode::WrongToken);
                }
                if let Some(req_output) = mission.requirement.output_token {
                    require!(output_token == req_output, ErrorCode::WrongToken);
                }
                // Check amount meets minimum
                require!(
                    swap_amount >= mission.requirement.min_amount,
                    ErrorCode::AmountTooLow
                );
                
                // Mark as completed
                progress.completed = true;
                progress.completed_at = Some(Clock::get()?.unix_timestamp);
                progress.current_value = swap_amount;
            }
            MissionType::Volume => {
                // Accumulate volume
                progress.current_value += swap_amount;
                
                // Check if target reached
                if let Some(target) = mission.requirement.target_volume {
                    if progress.current_value >= target {
                        progress.completed = true;
                        progress.completed_at = Some(Clock::get()?.unix_timestamp);
                    }
                }
            }
            MissionType::Streak => {
                // Streak logic would check timestamp gaps
                // Simplified for this example
                progress.current_value += 1;
                if let Some(target_days) = mission.requirement.streak_days {
                    if progress.current_value >= target_days as u64 {
                        progress.completed = true;
                        progress.completed_at = Some(Clock::get()?.unix_timestamp);
                    }
                }
            }
            MissionType::Prediction | MissionType::Staking => {
                // For hackathon: Assumes frontend/backend validation of the specific action
                // In production, would verify CPI or specific instruction data in the signature
                progress.completed = true;
                progress.completed_at = Some(Clock::get()?.unix_timestamp);
                progress.current_value = swap_amount; // Amount staked or predicted
            }
            _ => return Err(ErrorCode::UnsupportedMissionType.into()),
        }
        
        // Store proof
        progress.swap_signatures.push(swap_signature.clone());
        
        // Update mission stats
        let mission = &mut ctx.accounts.mission;
        if progress.completed {
            mission.completions += 1;
            
            emit!(MissionCompletedEvent {
                user: progress.user,
                mission: mission.key(),
                completed_at: progress.completed_at.unwrap(),
                proof: swap_signature,
            });
        } else {
            emit!(MissionProgressEvent {
                user: progress.user,
                mission: mission.key(),
                current_value: progress.current_value,
                target_value: mission.requirement.target_volume.unwrap_or(mission.requirement.min_amount),
            });
        }
        
        Ok(())
    }

    /// Claim reward after completing mission
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let progress = &mut ctx.accounts.progress;
        let mission = &ctx.accounts.mission;
        
        require!(progress.completed, ErrorCode::NotCompleted);
        require!(!progress.claimed, ErrorCode::AlreadyClaimed);
        
        // Mark as claimed
        progress.claimed = true;
        progress.claimed_at = Some(Clock::get()?.unix_timestamp);
        
        // Transfer token reward if specified
        if let Some(token_reward) = mission.reward.token_amount {
            let reward_vault = ctx.accounts.reward_vault.as_ref().ok_or(ErrorCode::Unauthorized)?;
            let user_token_account = ctx.accounts.user_token_account.as_ref().ok_or(ErrorCode::Unauthorized)?;
            let token_program = ctx.accounts.token_program.as_ref().ok_or(ErrorCode::Unauthorized)?;

            let cpi_accounts = Transfer {
                from: reward_vault.to_account_info(),
                to: user_token_account.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            };
            let config_bump = ctx.accounts.config.bump;
            let seeds = &[b"config".as_ref(), &[config_bump]];
            let signer = &[&seeds[..]];
            let cpi_program = token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, token_reward)?;
        }
        
        emit!(RewardClaimedEvent {
            user: progress.user,
            mission: mission.key(),
            xp: mission.reward.xp,
            token_amount: mission.reward.token_amount,
            badge_type: mission.reward.badge_type.clone(),
        });
        
        Ok(())
    }

    /// Deactivate a mission
    pub fn deactivate_mission(ctx: Context<UpdateMission>) -> Result<()> {
        let mission = &mut ctx.accounts.mission;
        require!(
            mission.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        
        mission.active = false;
        msg!("Mission {} deactivated", mission.mission_id);
        Ok(())
    }
}

// ============================================================================
// Account Structs
// ============================================================================

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub mission_count: u64,
    pub total_completions: u64,
    pub bump: u8,
}

#[account]
pub struct Mission {
    pub authority: Pubkey,
    pub mission_id: String,
    pub mission_type: MissionType,
    pub requirement: MissionRequirement,
    pub reward: MissionReward,
    pub metadata_uri: String,
    pub active: bool,
    pub completions: u64,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct UserProgress {
    pub user: Pubkey,
    pub mission: Pubkey,
    pub started_at: i64,
    pub completed: bool,
    pub completed_at: Option<i64>,
    pub claimed: bool,
    pub claimed_at: Option<i64>,
    pub current_value: u64,
    pub swap_signatures: Vec<String>,
    pub bump: u8,
}

// ============================================================================
// Data Types
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MissionType {
    Swap,
    Volume,
    Streak,
    DCA,
    Prediction,
    Staking,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct MissionRequirement {
    pub input_token: Option<Pubkey>,
    pub output_token: Option<Pubkey>,
    pub min_amount: u64,
    pub target_volume: Option<u64>,
    pub streak_days: Option<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MissionReward {
    pub xp: u64,
    pub badge_type: Option<String>,
    pub token_mint: Option<Pubkey>,
    pub token_amount: Option<u64>,
}

// ============================================================================
// Context Structs
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mission_id: String)]
pub struct RegisterMission<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 36 + 1 + 100 + 100 + 204 + 1 + 8 + 8 + 1,
        seeds = [b"mission", mission_id.as_bytes()],
        bump
    )]
    pub mission: Account<'info, Mission>,
    
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartMission<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 8 + 1 + 8 + 1 + 8 + 1 + 8 + 4 + (88 * 10) + 1,
        seeds = [b"progress", user.key().as_ref(), mission.key().as_ref()],
        bump
    )]
    pub progress: Account<'info, UserProgress>,
    
    #[account(seeds = [b"mission", mission.mission_id.as_bytes()], bump = mission.bump)]
    pub mission: Account<'info, Mission>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitProof<'info> {
    #[account(
        mut,
        seeds = [b"progress", user.key().as_ref(), mission.key().as_ref()],
        bump = progress.bump,
        constraint = progress.user == user.key() @ ErrorCode::Unauthorized
    )]
    pub progress: Account<'info, UserProgress>,
    
    #[account(mut, seeds = [b"mission", mission.mission_id.as_bytes()], bump = mission.bump)]
    pub mission: Account<'info, Mission>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [b"progress", user.key().as_ref(), mission.key().as_ref()],
        bump = progress.bump,
        constraint = progress.user == user.key() @ ErrorCode::Unauthorized
    )]
    pub progress: Account<'info, UserProgress>,
    
    #[account(seeds = [b"mission", mission.mission_id.as_bytes()], bump = mission.bump)]
    pub mission: Account<'info, Mission>,
    
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub reward_vault: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub user_token_account: Option<Account<'info, TokenAccount>>,
    
    pub user: Signer<'info>,
    pub token_program: Option<Program<'info, Token>>,
}

#[derive(Accounts)]
pub struct UpdateMission<'info> {
    #[account(mut, seeds = [b"mission", mission.mission_id.as_bytes()], bump = mission.bump)]
    pub mission: Account<'info, Mission>,
    
    pub authority: Signer<'info>,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct MissionRegisteredEvent {
    pub mission: Pubkey,
    pub mission_id: String,
    pub mission_type: MissionType,
    pub authority: Pubkey,
}

#[event]
pub struct MissionStartedEvent {
    pub user: Pubkey,
    pub mission: Pubkey,
    pub started_at: i64,
}

#[event]
pub struct MissionProgressEvent {
    pub user: Pubkey,
    pub mission: Pubkey,
    pub current_value: u64,
    pub target_value: u64,
}

#[event]
pub struct MissionCompletedEvent {
    pub user: Pubkey,
    pub mission: Pubkey,
    pub completed_at: i64,
    pub proof: String,
}

#[event]
pub struct RewardClaimedEvent {
    pub user: Pubkey,
    pub mission: Pubkey,
    pub xp: u64,
    pub token_amount: Option<u64>,
    pub badge_type: Option<String>,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Mission ID too long (max 32 chars)")]
    MissionIdTooLong,
    #[msg("Metadata URI too long (max 200 chars)")]
    MetadataUriTooLong,
    #[msg("Mission is not active")]
    MissionInactive,
    #[msg("Mission already completed")]
    AlreadyCompleted,
    #[msg("Reward already claimed")]
    AlreadyClaimed,
    #[msg("Mission not completed yet")]
    NotCompleted,
    #[msg("Invalid swap signature format")]
    InvalidSignature,
    #[msg("Wrong token for mission requirement")]
    WrongToken,
    #[msg("Swap amount below minimum requirement")]
    AmountTooLow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Mission type not supported")]
    UnsupportedMissionType,
}
