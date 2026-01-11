# DeFi Quest Engine - Deployment Commands

## Quick Deploy (Landing Page on GitHub Pages)

1. Push to GitHub:
```powershell
git add .
git commit -m "feat: hackathon submission enhancements"
git push origin main
```

2. Enable GitHub Pages in repo settings → Pages → Source: main → /packages/landing

---

## Deploy Admin Dashboard to Vercel

### Option 1: Vercel CLI (Recommended)
```powershell
# Install Vercel CLI
npm install -g vercel

# Navigate to admin dashboard
cd packages/admin-dashboard

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### Option 2: Vercel Web UI
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set root directory to: `packages/admin-dashboard`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Deploy

---

## Deploy Examples to Vercel (Static)

For simple-dapp and other HTML examples:
```powershell
cd examples/simple-dapp
npx vercel --prod
```

---

## After Deployment

Update README.md with your live URLs:
```markdown
| Demo | Link |
|------|------|
| 🌐 Landing Page | https://your-landing.vercel.app |
| 🎛️ Admin Dashboard | https://your-admin.vercel.app |
| 🔄 Simple dApp | https://your-demo.vercel.app |
```

---

## Recording Demo Video

### Recommended Tools
- **Loom** (easiest): https://loom.com
- **OBS Studio** (free, advanced)
- **Screencastify** (Chrome extension)

### Video Script (90 seconds)
1. **(0-10s)** Show landing page - "DeFi Quest Engine gamifies your Solana dApp"
2. **(10-25s)** Open simple-dapp - "Here's how it works"
3. **(25-40s)** Connect wallet - "Users connect and see available quests"
4. **(40-60s)** Complete a swap - "When they swap, quests auto-update"
5. **(60-75s)** Show mission completion - "Real Jupiter transactions verified on-chain"
6. **(75-90s)** Admin dashboard - "Manage everything from your dashboard"

### Export Settings
- Resolution: 1080p (1920x1080)
- Format: MP4 or upload directly to YouTube
- Length: Under 2 minutes
