# API Reference

Complete API documentation for the DeFi Quest Engine.

## QuestEngine

The main entry point for the quest engine.

### Constructor

```typescript
new QuestEngine(config: QuestEngineConfig)
```

#### QuestEngineConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `reownProjectId` | `string` | Yes | - | WalletConnect/Reown project ID |
| `supabaseUrl` | `string` | Yes | - | Supabase project URL |
| `supabaseKey` | `string` | Yes | - | Supabase anon key |
| `network` | `'mainnet-beta' \| 'devnet' \| 'testnet'` | No | `'devnet'` | Solana network |
| `solanaRpcUrl` | `string` | No | Public RPC | Custom RPC endpoint |
| `jupiterApiUrl` | `string` | No | `'https://quote-api.jup.ag/v6'` | Jupiter API URL |
| `useLocalStorage` | `boolean` | No | `true` | Enable localStorage caching |
| `syncInterval` | `number` | No | `30000` | Backend sync interval (ms) |
| `enableNotifications` | `boolean` | No | `true` | Enable UI notifications |
| `enableLeaderboard` | `boolean` | No | `true` | Enable leaderboard |

### Methods

#### initialize()

```typescript
async initialize(): Promise<void>
```

Initialize the engine, connect to Solana and Supabase.

---

#### connectWallet()

```typescript
async connectWallet(): Promise<WalletInfo | null>
```

Connect to a Solana wallet (Phantom, Solflare, or Jupiter Mobile).

**Returns:** `WalletInfo` object or `null` if cancelled.

---

#### disconnectWallet()

```typescript
async disconnectWallet(): Promise<void>
```

Disconnect the current wallet.

---

#### isConnected()

```typescript
isConnected(): boolean
```

Check if a wallet is connected.

---

#### getWallet()

```typescript
getWallet(): WalletInfo | null
```

Get current wallet information.

---

#### registerMissions()

```typescript
registerMissions(missions: Mission[]): void
```

Register mission definitions with the engine.

---

#### getMissions()

```typescript
getMissions(): Mission[]
```

Get all registered missions.

---

#### getActiveMissions()

```typescript
getActiveMissions(): Mission[]
```

Get only active, non-expired missions.

---

#### getUserProgress()

```typescript
getUserProgress(walletAddress?: string): MissionProgress[]
```

Get mission progress for a user. Defaults to connected wallet.

---

#### startMission()

```typescript
startMission(missionId: string): MissionProgress | null
```

Start tracking progress on a mission.

---

#### claimReward()

```typescript
claimReward(missionId: string): MissionReward | null
```

Claim reward for a completed mission.

---

#### getUserStats()

```typescript
getUserStats(walletAddress?: string): UserStats | null
```

Get aggregate statistics for a user.

---

#### getLeaderboard()

```typescript
async getLeaderboard(limit?: number): Promise<UserStats[]>
```

Get top users by points.

---

#### getStreak()

```typescript
getStreak(walletAddress?: string): StreakData | null
```

Get current streak data for a user.

---

#### verifySwap()

```typescript
async verifySwap(signature: string): Promise<SwapVerificationResult>
```

Manually verify a transaction as a Jupiter swap.

---

#### sync()

```typescript
async sync(): Promise<boolean>
```

Force synchronization with Supabase backend.

---

#### destroy()

```typescript
destroy(): void
```

Clean up listeners and intervals.

---

### Events

```typescript
engine.on(event: string, handler: Function)
```

| Event | Payload | Description |
|-------|---------|-------------|
| `mission:started` | `{ mission, walletAddress }` | User started a mission |
| `mission:progress` | `{ mission, progress }` | Progress updated |
| `mission:completed` | `{ mission, progress }` | Mission completed |
| `mission:claimed` | `{ mission, reward }` | Reward claimed |
| `streak:updated` | `{ walletAddress, streakDays }` | Streak incremented |
| `streak:broken` | `{ walletAddress, previousStreak }` | Streak was broken |
| `swap:detected` | `{ swap }` | Jupiter swap detected |
| `engine:initialized` | `{ config }` | Engine ready |
| `engine:error` | `{ error }` | Error occurred |

---

## Types

### Mission

```typescript
interface Mission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  difficulty: Difficulty;
  requirement: MissionRequirement;
  reward: MissionReward;
  resetCycle: ResetCycle;
  startDate?: Date;
  endDate?: Date;
  icon?: string;
  category?: string;
  prerequisites?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### MissionType

```typescript
enum MissionType {
  SWAP = 'swap',
  VOLUME = 'volume',
  STREAK = 'streak',
  PRICE = 'price',
  ROUTING = 'routing',
}
```

### Difficulty

```typescript
enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  LEGENDARY = 'legendary',
}
```

### MissionProgress

```typescript
interface MissionProgress {
  missionId: string;
  walletAddress: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  status: MissionStatus;
  startedAt: Date;
  completedAt?: Date;
  claimedAt?: Date;
  streakDays?: number;
  relatedTransactions: string[];
}
```

### UserStats

```typescript
interface UserStats {
  walletAddress: string;
  totalPoints: number;
  totalMissionsCompleted: number;
  totalVolumeUsd: number;
  longestStreak: number;
  currentStreak: number;
  achievements: string[];
  rank?: number;
  joinedAt: Date;
  lastActiveAt: Date;
}
```

---

## Web Components

### quest-mission-list

Displays a list of missions with progress.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme |

#### Methods

```typescript
setMissions(missions: Mission[], progress: Map<string, MissionProgress>): void
updateProgress(missionId: string, progress: MissionProgress): void
```

#### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `mission-action` | `{ missionId, action }` | User clicked start/claim |
| `mission-click` | `{ missionId }` | User clicked a mission card |

---

### quest-progress-bar

Visual progress indicator.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | `number` | Current value |
| `max` | `number` | Maximum value |
| `label` | `string` | Label text |
| `color` | `string` | Fill color |
| `compact` | `boolean` | Compact mode |

#### Methods

```typescript
setMilestones(milestones: { value: number; label: string }[]): void
```

---

### quest-leaderboard

Displays user rankings.

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `current-user` | `string` | Highlight this wallet address |

#### Methods

```typescript
setData(users: UserStats[], currentUserAddress?: string): void
setLoading(loading: boolean): void
```

#### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `refresh` | - | User clicked refresh |
| `user-click` | `{ walletAddress }` | User clicked a row |

---

### quest-notification-toast

Toast notifications.

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Position on screen |

#### Methods

```typescript
show(options: ToastOptions): string // Returns toast ID
success(title: string, message?: string): string
error(title: string, message?: string): string
warning(title: string, message?: string): string
info(title: string, message?: string): string
achievement(title: string, reward?: string): string
dismiss(id: string): void
dismissAll(): void
```

---

## CSS Variables

Customize component appearance:

```css
:root {
  --dqe-primary-color: #7c3aed;
  --dqe-background: #0a0a0f;
  --dqe-card-bg: #14141f;
  --dqe-border-color: #2a2a3f;
  --dqe-text-color: #ffffff;
  --dqe-text-secondary: #8888aa;
  --dqe-success-color: #10b981;
  --dqe-warning-color: #f59e0b;
  --dqe-error-color: #ef4444;
  --dqe-border-radius: 12px;
}
```
