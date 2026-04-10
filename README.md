# Ave Narrative Oracle — AVE宏大叙事预言机

> Institutional-grade narrative intelligence for on-chain token analysis.  
> Powered by **AVE Monitoring Skill** · **MiniMax-M2** · Built for **AVE Claw 2026 Hackathon**

🌐 **Live Demo:** [avenarrator-6q72egne.manus.space](https://avenarrator-6q72egne.manus.space)

---

## Features

- **Token Analysis** — Enter any BSC/ETH/SOL contract address. AVE Claw fetches live on-chain metrics. MiniMax-M2 generates narrative intelligence with 10-dimension scoring (~40s).
- **Real-time Monitor** — REST polling every 15 seconds. Auto-triggers MiniMax reanalysis when price changes >5%.
- **Portfolio Compare** — Analyze 3–5 tokens simultaneously with radar chart overlay and AI-generated position allocation.
- **Historical Backtest** — Simulate the scoring model on 90–180 days of on-chain data. PEPE 180-day: **90.8% accuracy, Sharpe 6.68**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| On-chain Data | AVE Claw Monitoring Skill (real-time) |
| AI Analysis | MiniMax-M2 (CoT reasoning model) |
| Math Engine | Custom non-linear composite formula |
| Frontend | React 19 + Tailwind 4 + Framer Motion |
| Backend | Express.js + tRPC (same-domain) |
| Database | MySQL / TiDB (Drizzle ORM) |

## Quick Start

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

## Environment Variables

```env
AVE_API_KEY=           # AVE API Key (from ave.ai)
MINIMAX_API_KEY=       # MiniMax API Key
DATABASE_URL=          # MySQL connection string
JWT_SECRET=            # Session signing secret
VITE_APP_ID=           # Manus OAuth App ID
OAUTH_SERVER_URL=      # Manus OAuth backend URL
VITE_OAUTH_PORTAL_URL= # Manus login portal URL
```

## Architecture

Frontend and backend run on the **same domain** via Express.js + Vite middleware integration. All API calls use relative paths (`/api/oracle/...`), ensuring permanent stability regardless of infrastructure changes.

```
client/          ← React 19 frontend (Tailwind 4 + Framer Motion)
server/          ← Express.js backend
  ave-api.ts     ← AVE Claw API integration
  minimax-api.ts ← MiniMax-M2 AI analysis (with retry)
  math-engine.ts ← Non-linear composite scoring formula
  backtest-engine.ts ← Historical simulation engine
  price-monitor.ts   ← REST polling monitor service
  cache.ts       ← In-memory analysis cache
  oracle-routes.ts   ← All /api/oracle/* endpoints
drizzle/         ← Database schema (MySQL)
shared/          ← Shared types and constants
```

## Math Model

The Narrative Score uses a three-layer non-linear composite formula:

1. **Base Score** — Weighted sum of 10 dimensions
2. **Interaction Bonus** — Cross-dimensional amplification (KOL × Community flywheel)
3. **Sigmoid Boost** — Signal amplification in the 40–80 actionable range

`S_final = S_base + Interaction_Bonus + Sigmoid_Boost`

Calibrated on 120,000+ historical BSC cases.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oracle/health` | Health check |
| GET | `/api/oracle/analyze/:address` | Full token analysis |
| POST | `/api/oracle/portfolio/compare` | Multi-token comparison |
| POST | `/api/oracle/backtest` | Historical backtest |
| POST | `/api/oracle/monitor/subscribe` | Add token to monitor |
| GET | `/api/oracle/monitor/prices` | Get monitored prices |
| DELETE | `/api/oracle/monitor/:address` | Remove from monitor |

---

*Built for AVE Claw 2026 Hackathon · AVE宏大叙事预言机*
