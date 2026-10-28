# GridBloom 🌸

An original, mobile-first casual block-placement puzzle game with vibrant jewel-toned visuals, combo streaks, daily challenges, and the signature **Bloom Pulse** clearing mechanic.

Built with **React**, **TypeScript**, **Vite**, and **Phaser 3** for high-performance 2D rendering, accompanied by resilient local storage and optional online **Supabase** leaderboards.

---

## 🎮 Game Concept & Rules

- **The Grid**: An 8x8 matrix where polyomino pieces (built from unit blocks) are placed. Pieces do not fall with gravity.
- **Piece Tray**: Holds 3 available pieces at a time. Pieces may be played in any order. The tray automatically refills with 3 fresh shapes once all three current pieces are used.
- **Line Clears**: Completing full horizontal rows or vertical columns vaporizes them simultaneously. Intersecting blocks are cleared cleanly without double-counting.
- **Scoring & Combos**:
  - Placed blocks: 1 point per unit block in the piece.
  - Cleared lines: 10 base points per line.
  - Multiline bonus: +30 for 2 lines, +80 for 3 lines, +160 for 4 lines, +260 for 5+ lines in a single turn.
  - Combo streaks: Consecutive turns that clear lines increase your combo multiplier (`x2`, `x3`, ...), granting `(combo - 1) * 15` extra points per turn. Combo resets to 0 on turns with no line clears.
- **Bloom Pulse Mechanic**:
  - Completed lines charge the **Pulse Energy Meter** (+20% per line cleared + combo bonus).
  - Upon reaching 100%, the **USE PULSE** button activates.
  - Tap "USE PULSE" to enter targeting mode, then tap any non-empty row or column on the board to vaporize it instantly!
  - Consumes exactly 100 charge on valid activation.
- **Game Over**: When none of the available pieces in the tray can fit anywhere on the board, the run ends.

---

## 🕹️ Controls

- **Desktop**: Mouse drag-and-drop to place pieces. Keyboard shortcuts:
  - `Enter` / `Space`: Start game on title screen.
  - `Esc` or `P`: Pause / Resume game.
  - `M`: Toggle Sound Mute.
- **Mobile**: Touch drag-and-drop with finger-offset compensation so your thumb never obscures the placement preview.
- **Skip Title**: Append `?autostart=1` to the URL to skip directly to active gameplay.

---

## 🛠️ Prerequisites & Local Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Exact Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Type check & lint
npm run lint

# 4. Start local development server (runs on port 3000)
npm run dev

# 5. Build for production
npm run build
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Public / Private | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Public (Client safe) | Optional | URL of your Supabase project instance |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (Client safe) | Optional | Anon / publishable Supabase API key |
| `VITE_ADS_ENABLED` | Public (Client safe) | Optional | Set to `'true'` to activate ad provider |
| `VITE_AD_PROVIDER` | Public (Client safe) | Optional | Set to `'test'` for simulated dev rewarded ads |

> **Security Guarantee**:
> - Never expose Supabase service-role keys or private monetization credentials in `VITE_` variables or frontend code.
> - When Supabase is not configured, GridBloom operates in **100% offline / local mode** without crashing.

---

## ☁️ Supabase Setup & Deployment

GridBloom includes optional online leaderboards:
- **Anonymous Authentication**: Enabled only when the user chooses to participate, with guest names (e.g., `EmeraldPuzzler545`).
- **Row Level Security (RLS)**: Enforced on all tables. Public read access is permitted for leaderboard standings, but users can only insert or update their own verified scores.

### Migrations
The SQL schema is located at `supabase/migrations/20261028_leaderboard.sql`.
To apply via Supabase CLI:
```bash
supabase db push
```

### Edge Function
The server-side score verification endpoint is in `supabase/functions/submit-score/index.ts`.
To deploy:
```bash
supabase functions deploy submit-score
```

---

## 📺 Ads & Monetization Architecture

Located in `src/services/ads/adProvider.ts`:
- **Provider-Neutral Interface**: `AdProvider` defines availability, rewarded rescue, and interstitials.
- **Rewarded Rescue**: 1 optional rescue per game run, offering a 4x4 central clear. Duplicate rewards are blocked. Rewards are granted **only** after confirmed completion.
- **Interstitials**: Conservative frequency caps (never on first run, maximum once per 3 completed runs), never interrupting active gameplay.
- **Current Status**: Defaults to `NullAdProvider` (disabled). For mobile packaging (e.g. Capacitor / Cordova / React Native WebView), implement `AdProvider` for Google AdMob or Unity Ads without modifying core game logic.

---

## 📦 Project File Structure

```
src/
├── components/          # React Game Shell & UI Modals
│   ├── TitleScreen.tsx
│   ├── HudBar.tsx
│   ├── PauseModal.tsx
│   ├── GameOverModal.tsx
│   ├── DailyChallengeModal.tsx
│   ├── LeaderboardModal.tsx
│   ├── SettingsModal.tsx
│   └── TutorialModal.tsx
├── game/
│   ├── audio/           # Pure Web Audio procedural sound synthesizer
│   ├── engine/          # Decoupled pure TypeScript game rules, board, PRNG & daily engine
│   ├── phaser/          # Phaser 3 scene, vector graphics, drag snapping, particles & React bridge
│   └── pieces/          # Curated polyomino shapes, matrices, colors & weights
├── services/
│   ├── ads/             # Provider-neutral ad integration & rescue logic
│   └── supabase/        # Optional leaderboard client & service
├── storage/             # Versioned local storage & data migration
├── App.tsx              # State machine controller
└── main.tsx             # React entry point
```
