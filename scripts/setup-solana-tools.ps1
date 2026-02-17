# Solana Toolchain Setup Script
# Run this to install the Solana CLI tools needed for Anchor builds

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Solana Toolchain Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if solana-install is available
$solanaInstall = Get-Command solana-install -ErrorAction SilentlyContinue

if (-not $solanaInstall) {
    Write-Host "Installing Solana CLI..." -ForegroundColor Yellow
    
    # Download and run solana-install init
    $installScript = @"
    sh -c "`$(curl -sSfL 'https://release.solana.com/v1.18.22/install')"
"@
    
    # For Windows, we need WSL or manual installation
    Write-Host ""
    Write-Host "SOLANA CLI INSTALLATION OPTIONS:" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Option 1: Install via solana-install (requires WSL on Windows):" -ForegroundColor White
    Write-Host "  1. Install WSL2: wsl --install" -ForegroundColor Gray
    Write-Host "  2. In WSL: sh -c \"$(curl -sSfL 'https://release.solana.com/v1.18.22/install')\"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Manual download:" -ForegroundColor White
    Write-Host "  Download from: https://github.com/solana-labs/solana/releases/tag/v1.18.22" -ForegroundColor Gray
    Write-Host "  Extract to: C:\Users\HP OMEN 15 GAMING\.cargo\bin\" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3: Use prebuilt binaries:" -ForegroundColor White
    Write-Host "  anchor build --program-name defi-quest --" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Solana CLI found, installing v1.18.22..." -ForegroundColor Yellow
    solana-install init v1.18.22
}

Write-Host ""
Write-Host "After installation, verify with:" -ForegroundColor Cyan
Write-Host "  solana --version" -ForegroundColor White
Write-Host "  anchor --version" -ForegroundColor White
Write-Host ""
