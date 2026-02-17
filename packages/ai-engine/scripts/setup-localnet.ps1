# DeFi Quest Engine - Setup Localnet
# Run this script to set up localnet for AI Agent Swarm testing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Localnet Setup for DeFi Quest" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Solana CLI is installed
$solanacli = Get-Command solana -ErrorAction SilentlyContinue

if (-not $solanacli) {
    Write-Host "ERROR: Solana CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Solana CLI first:" -ForegroundColor Yellow
    Write-Host "  https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
}

# Set config to localnet
Write-Host "Setting Solana to localnet..." -ForegroundColor Yellow
solana config set --url localhost

Write-Host ""
Write-Host "? Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. In a NEW terminal, run: solana-test-validator --reset" -ForegroundColor White
Write-Host "2. Wait for validator to start (shows block height)" -ForegroundColor White
Write-Host "3. In THIS terminal, run: npx tsx scripts/demo-swarm.ts" -ForegroundColor White
Write-Host ""
