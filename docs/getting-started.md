# Getting Started with DeFi Quest Engine

This guide will walk you through integrating the DeFi Quest Engine into your Solana dApp.

## Prerequisites

- Node.js 18+
- A Solana dApp (or create a new one)
- Supabase account (free tier works)
- Reown (WalletConnect) project ID

## Step 1: Get Your Credentials

### Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your project URL and anon key from Settings > API
3. Run the SQL schema from the README to create tables

### Reown Project ID

1. Go to [dashboard.reown.com](https://dashboard.reown.com)
2. Create a new project for Solana
3. Copy your project ID

## Step 2: Install Packages

```bash
npm install @defi-quest/core @defi-quest/ui-components
# or
yarn add @defi-quest/core @defi-quest/ui-components
```

## Step 3: Initialize the Engine

```typescript
import { QuestEngine } from '@defi-quest/core';

const engine = new QuestEngine({
  reownProjectId: 'dc8ff06ef233d8855725e0d0e227c15b',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-supabase-anon-key',
  network: 'devnet', // or 'mainnet-beta'
});

// Initialize (call once on app start)
await engine.initialize();
```

## Step 4: Define Your Missions

```typescript
import { Mission, MissionType, Difficulty, ResetCycle, MissionStatus } from '@defi-quest/core';

const missions: Mission[] = [
  {
    id: 'swap-sol-1',
    name: 'Swap 1 SOL',
    description: 'Complete a swap of at least 1 SOL to any token',
    type: MissionType.SWAP,
    status: MissionStatus.ACTIVE,
    difficulty: Difficulty.EASY,
    requirement: {
      type: 'swap',
      minInputAmount: 1,
    },
    reward: {
      points: 50,
    },
    resetCycle: ResetCycle.NONE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'volume-100',
    name: '$100 Volume',
    description: 'Complete $100 in total swap volume',
    type: MissionType.VOLUME,
    status: MissionStatus.ACTIVE,
    difficulty: Difficulty.MEDIUM,
    requirement: {
      type: 'volume',
      minVolumeUsd: 100,
    },
    reward: {
      points: 100,
    },
    resetCycle: ResetCycle.WEEKLY,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'streak-7',
    name: '7-Day Streak',
    description: 'Swap for 7 consecutive days',
    type: MissionType.STREAK,
    status: MissionStatus.ACTIVE,
    difficulty: Difficulty.HARD,
    requirement: {
      type: 'streak',
      requiredDays: 7,
      actionType: 'swap',
    },
    reward: {
      points: 200,
      achievementId: 'week-warrior',
    },
    resetCycle: ResetCycle.NONE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Register missions
engine.registerMissions(missions);
```

## Step 5: Connect Wallet & Track Progress

```typescript
// Connect wallet button handler
document.getElementById('connectBtn').addEventListener('click', async () => {
  const wallet = await engine.connectWallet();
  console.log('Connected:', wallet?.address);
});

// Get user's mission progress
const progress = engine.getUserProgress();
console.log('Progress:', progress);

// Get user stats
const stats = engine.getUserStats();
console.log('Points:', stats?.totalPoints);
console.log('Streak:', stats?.currentStreak);
```

## Step 6: Add UI Components

### HTML

```html
<!-- Mission list widget -->
<quest-mission-list theme="dark" id="missionList"></quest-mission-list>

<!-- Toast notifications -->
<quest-notification-toast position="top-right" id="toast"></quest-notification-toast>

<!-- Leaderboard -->
<quest-leaderboard id="leaderboard"></quest-leaderboard>
```

### Connecting UI to Engine

```typescript
import '@defi-quest/ui-components';

const missionList = document.getElementById('missionList');
const toast = document.getElementById('toast');
const leaderboard = document.getElementById('leaderboard');

// Populate mission list
function updateUI() {
  const missions = engine.getMissions();
  const progress = engine.getUserProgress();
  const progressMap = new Map(progress.map(p => [p.missionId, p]));
  
  missionList.setMissions(missions, progressMap);
}

// Listen for mission events
engine.on('mission:completed', ({ mission }) => {
  toast.achievement(mission.name, `+${mission.reward.points} points`);
  updateUI();
});

engine.on('mission:progress', () => {
  updateUI();
});

// Load leaderboard
async function loadLeaderboard() {
  const leaders = await engine.getLeaderboard(10);
  leaderboard.setData(leaders, engine.getWallet()?.address);
}

// Handle mission actions from UI
missionList.addEventListener('mission-action', async (e) => {
  const { missionId, action } = e.detail;
  
  if (action === 'start') {
    engine.startMission(missionId);
    toast.success('Mission Started', 'Good luck!');
  } else if (action === 'claim') {
    const reward = engine.claimReward(missionId);
    if (reward) {
      toast.achievement('Reward Claimed!', `+${reward.points} points`);
    }
  }
  
  updateUI();
});
```

## Step 7: Listen for Swap Detection

The engine automatically watches for Jupiter swaps when a wallet is connected:

```typescript
engine.on('swap:detected', ({ swap }) => {
  console.log('Swap detected!', swap);
  toast.info('Swap Detected', `${swap.inputAmount} ${swap.inputToken.symbol} → ${swap.outputToken.symbol}`);
});
```

## Full Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My dApp with Quests</title>
</head>
<body>
  <button id="connectBtn">Connect Wallet</button>
  <div id="wallet"></div>
  
  <quest-mission-list theme="dark" id="missionList"></quest-mission-list>
  <quest-notification-toast position="top-right" id="toast"></quest-notification-toast>

  <script type="module">
    import { QuestEngine } from '@defi-quest/core';
    import '@defi-quest/ui-components';

    const engine = new QuestEngine({
      reownProjectId: 'YOUR_ID',
      supabaseUrl: 'YOUR_URL',
      supabaseKey: 'YOUR_KEY',
      network: 'devnet',
    });

    await engine.initialize();

    // Register missions
    engine.registerMissions([/* your missions */]);

    // Connect wallet
    document.getElementById('connectBtn').onclick = async () => {
      const wallet = await engine.connectWallet();
      document.getElementById('wallet').textContent = wallet?.address || '';
    };

    // Update UI
    function updateUI() {
      const missionList = document.getElementById('missionList');
      const missions = engine.getMissions();
      const progress = new Map(engine.getUserProgress().map(p => [p.missionId, p]));
      missionList.setMissions(missions, progress);
    }

    engine.on('mission:completed', () => {
      document.getElementById('toast').achievement('Mission Complete!');
      updateUI();
    });

    updateUI();
  </script>
</body>
</html>
```

## What's Next?

- [API Reference](./api-reference.md) - Detailed API documentation
- [Examples](../examples/) - See working demos
- [Admin Dashboard](../packages/admin-dashboard/) - Manage missions visually
