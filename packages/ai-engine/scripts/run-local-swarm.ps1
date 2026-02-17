# DeFi Quest Engine - Localnet Swarm Runner
# Run this to start the AI Agent Swarm on localnet

Write-Host "" -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   ?? DeFi Quest Engine: AI AGENT SWARM SETUP ??" -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Check if solana-test-validator is running
$validatorRunning = Get-Process "solana-test-validator" -ErrorAction SilentlyContinue

if (-not $validatorRunning) {
    Write-Host "? Local validator NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run these commands in a NEW terminal:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   solana-test-validator --reset" -ForegroundColor White
    Write-Host ""
    Write-Host "Keep that terminal open. Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "? Local validator is running!" -ForegroundColor Green
Write-Host ""

# Check Solana config
Write-Host "Checking Solana configuration..." -ForegroundColor Yellow
$configOutput = solana config get 2>&1
Write-Host $configOutput
Write-Host ""

# Check wallet balance
Write-Host "Checking wallet balance..." -ForegroundColor Yellow
$balance = solana balance 2>&1
Write-Host "Wallet balance: $balance" -ForegroundColor Green
Write-Host ""

# Run the swarm
Write-Host "Starting AI Agent Swarm..." -ForegroundColor Cyan
Write-Host ""

cd "C:\Users\HP OMEN 15 GAMING\OneDrive\Desktop\Vibe coding\defi-quest-engine\packages\ai-engine"
npx tsx scripts/demo-swarm.ts
