/**
 * Ave Narrative Oracle — API Client v3.0
 * 
 * CRITICAL FIX: All API calls now use relative paths (/api/oracle/...)
 * This means the frontend and backend run in the SAME process on the SAME domain.
 * No more cross-origin issues, no more URL changes after sandbox restarts!
 */

// All API calls use relative paths — same domain, no CORS, no URL changes
const API_BASE = "/api/oracle";

// ============================================================
// Type Definitions
// ============================================================

export interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

export interface HolderGrowthPoint {
  time: string;
  holders: number;
  change: number;
}

export interface NarrativeMetrics {
  cultural_resonance: number;
  community_growth: number;
  holder_distribution: number;
  liquidity_mc_ratio: number;
  volume_mc_ratio: number;
  kol_endorsement: number;
  tokenomics: number;
  onchain_timing: number;
  smart_money_flow: number;
  viral_potential: number;
}

export interface MathModelOutput {
  s_final: number;
  s_base: number;
  health_score: number;
  p_breakout: number;
  mc_peak_estimate: number;
  interaction_bonus: number;
  sigmoid_boost: number;
  grade: string;
  recommendation: string;
  // Legacy field aliases for backward compatibility
  final_narrative_score: number;
  breakout_probability: number;
  peak_mc_low: number;
  peak_mc_high: number;
  hold_value_score: number;
  base_score: number;
  // Old field names that some pages may reference
  interaction_celebrity_narrative: number;
  interaction_culture_viral: number;
}

export interface MiniMaxAnalysis {
  narrative_summary: string;
  key_catalysts?: string[];
  risk_factors?: string[] | string;
  comparable_cases?: string[];
  confidence_level: string;
  hedge_strategy?: string;
  investment_thesis?: string;
  // Legacy field aliases
  key_endorsement_detail?: string;
  hedging_strategy?: string;
}

export interface AnalysisResponse {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  current_price_usd: number;
  market_cap: number;
  fdv: number;
  tvl: number;
  volume_24h: number;
  price_change_24h: number;
  price_change_1h: number;
  holders: number;
  total_supply: number;
  burn_amount: number;
  locked_percent: number;
  price_vs_ath_ratio: number;
  metrics: NarrativeMetrics;
  model_output: MathModelOutput;
  ai_analysis: MiniMaxAnalysis;
  radar_data: RadarDataPoint[];
  holder_growth: HolderGrowthPoint[];
  contract_risk_score: number;
  smart_money_net_flow: number;
  analysis_latency_ms: number;
  cached: boolean;
  timestamp: number;
}

export interface ExampleToken {
  name: string;
  symbol: string;
  chain: string;
  address: string;
  tag: string;
  mc: string;
  change: string;
  description: string;
}

// ============================================================
// Core Analysis
// ============================================================

export async function analyzeToken(
  address: string,
  chain?: string
): Promise<AnalysisResponse> {
  const controller = new AbortController();
  // 150 second timeout — MiniMax-M2 CoT analysis can take up to 90s
  const timeoutId = setTimeout(() => controller.abort(), 150000);

  try {
    const params = chain ? `?chain=${encodeURIComponent(chain)}` : "";
    const response = await fetch(
      `${API_BASE}/analyze/${encodeURIComponent(address)}${params}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize model_output for backward compatibility
    if (data.model_output) {
      data.model_output.final_narrative_score = data.model_output.s_final;
      data.model_output.breakout_probability = data.model_output.p_breakout;
      data.model_output.base_score = data.model_output.s_base;
      data.model_output.hold_value_score = data.model_output.health_score;
      data.model_output.peak_mc_low = data.model_output.mc_peak_estimate * 0.6;
      data.model_output.peak_mc_high = data.model_output.mc_peak_estimate * 1.4;
    }
    
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Analysis timed out after 150s. The AI model is busy, please retry.");
    }
    throw err;
  }
}

// ============================================================
// Example Tokens
// ============================================================

export async function getExampleTokens(): Promise<ExampleToken[]> {
  try {
    const response = await fetch(`${API_BASE}/examples`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Failed to fetch examples");
    const data = await response.json();
    return data.tokens || [];
  } catch {
    // Static fallback
    return [
      {
        name: "币安人生",
        symbol: "币安人生",
        chain: "BSC",
        address: "0x924fa68a0fc644485b8df8abfa0a41c2e7744444",
        tag: "Binance Ecosystem Meme",
        mc: "90.2M",
        change: "+8%",
        description: "CZ/He Yi endorsed BSC meme token, Oct 2025",
      },
      {
        name: "Giggle",
        symbol: "GIGGLE",
        chain: "BSC",
        address: "0x20d6015660b3fe52e6690a889b5c51f69902ce0e",
        tag: "CZ Endorsed Charity",
        mc: "26.2M",
        change: "+3%",
        description: "CZ endorsed charity meme on BSC",
      },
      {
        name: "PEPE",
        symbol: "PEPE",
        chain: "ETH",
        address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
        tag: "Cultural Icon",
        mc: "1.45B",
        change: "-2%",
        description: "Cultural meme icon on ETH",
      },
    ];
  }
}

// ============================================================
// Portfolio Compare
// ============================================================

export interface PortfolioToken {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  current_price_usd: number;
  market_cap: number;
  volume_24h?: number;
  holders?: number;
  price_change_24h?: number;
  final_score: number;
  breakout_probability: number;
  hold_value_score: number;
  peak_mc_low: number;
  peak_mc_high: number;
  contract_risk_score: number;
  metrics: NarrativeMetrics;
  radar_data: RadarDataPoint[];
  ai_summary: string;
  confidence_level: string;
  cached: boolean;
  model_output?: MathModelOutput;
}

export interface PortfolioSummary {
  total_tokens: number;
  avg_score: number;
  max_score: number;
  min_score: number;
  best_token: string;
  worst_token: string;
}

export interface PositionSuggestion {
  symbol: string;
  name: string;
  chain: string;
  narrative_score: number;
  suggested_weight_pct: number;
  risk_level: string;
  action: string;
}

export interface PortfolioCompareResponse {
  tokens: PortfolioToken[];
  summary: PortfolioSummary;
  radar_comparison: Array<Record<string, number | string>>;
  position_suggestions: PositionSuggestion[];
  errors: string[];
  timestamp: number;
}

export async function comparePortfolio(
  addresses: string[],
  _chains?: string[]
): Promise<PortfolioCompareResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min for multiple tokens

  try {
    const response = await fetch(`${API_BASE}/portfolio/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Normalize token data for Portfolio page compatibility
    const normalizedTokens: PortfolioToken[] = (data.tokens || []).map((t: any) => {
      const mo = t.model_output || {};
      return {
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        chain: t.chain,
        current_price_usd: t.current_price_usd || 0,
        market_cap: t.market_cap || 0,
        volume_24h: t.volume_24h || 0,
        holders: t.holders || 0,
        price_change_24h: t.price_change_24h || 0,
        final_score: mo.s_final || 0,
        breakout_probability: mo.p_breakout || 0,
        hold_value_score: mo.health_score || 0,
        peak_mc_low: (mo.mc_peak_estimate || 0) * 0.6,
        peak_mc_high: (mo.mc_peak_estimate || 0) * 1.4,
        contract_risk_score: t.contract_risk_score || 5,
        metrics: t.metrics || {},
        radar_data: t.radar_data || [],
        ai_summary: t.ai_analysis?.narrative_summary || "",
        confidence_level: t.ai_analysis?.confidence_level || "Medium",
        cached: t.cached || false,
        model_output: mo,
      };
    });

    // Build summary
    const scores = normalizedTokens.map((t) => t.final_score);
    const summary: PortfolioSummary = {
      total_tokens: normalizedTokens.length,
      avg_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      max_score: scores.length > 0 ? Math.max(...scores) : 0,
      min_score: scores.length > 0 ? Math.min(...scores) : 0,
      best_token: normalizedTokens.find((t) => t.final_score === Math.max(...scores))?.symbol || "",
      worst_token: normalizedTokens.find((t) => t.final_score === Math.min(...scores))?.symbol || "",
    };

    // Build radar comparison
    const radarComparison = ["Cultural", "Community", "KOL", "Liquidity", "Volume", "Viral"].map(
      (subject) => {
        const row: Record<string, number | string> = { subject };
        normalizedTokens.forEach((t) => {
          const rd = t.radar_data.find((r) => r.subject === subject);
          row[t.symbol] = rd ? rd.value : 0;
        });
        return row;
      }
    );

    // Build position suggestions
    const totalScore = scores.reduce((a, b) => a + b, 0) || 1;
    const positionSuggestions: PositionSuggestion[] = normalizedTokens.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      chain: t.chain,
      narrative_score: t.final_score,
      suggested_weight_pct: Math.round((t.final_score / totalScore) * 100 * 10) / 10,
      risk_level: t.final_score >= 70 ? "Medium" : t.final_score >= 50 ? "High" : "Very High",
      action: t.final_score >= 75 ? "Strong Buy" : t.final_score >= 60 ? "Buy" : t.final_score >= 45 ? "Hold" : "Reduce",
    }));

    return {
      tokens: normalizedTokens,
      summary,
      radar_comparison: radarComparison,
      position_suggestions: positionSuggestions,
      errors: data.errors || [],
      timestamp: data.timestamp || Math.floor(Date.now() / 1000),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") throw new Error("Portfolio analysis timed out. Please try with fewer tokens.");
    throw err;
  }
}

// ============================================================
// Backtest
// ============================================================

export interface BacktestDataPoint {
  timestamp: number;
  date: string;
  date_str?: string;
  price: number;
  score: number;
  predicted_score?: number;
  signal: "BUY" | "HOLD" | "SELL";
  actual_return_7d: number;
  predicted_return_7d: number;
  correct: boolean;
}

export interface MonthlyAccuracy {
  month: string;
  accuracy: number;
  total: number;
  correct: number;
}

export interface BacktestResponse {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  period_days: number;
  current_score: number;
  accuracy_rate: number;
  accuracy_pct: number;
  total_predictions: number;
  correct_predictions: number;
  avg_predicted_score: number;
  avg_actual_return: number;
  avg_actual_return_pct: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  data_points: BacktestDataPoint[];
  monthly_accuracy: MonthlyAccuracy[];
  signal_distribution: { BUY: number; HOLD: number; SELL: number };
  model_version: string;
  benchmark_comparison: Record<string, { accuracy: number; score: number }>;
  timestamp: number;
}

export async function runBacktest(
  address: string,
  periodDays: number = 90,
  _chain?: string
): Promise<BacktestResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150000);

  try {
    const response = await fetch(`${API_BASE}/backtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, period_days: periodDays }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Normalize data_points for backward compatibility
    if (data.data_points) {
      data.data_points = data.data_points.map((dp: any) => ({
        ...dp,
        date: dp.date_str || dp.date || "",
        score: dp.predicted_score || dp.score || 0,
      }));
    }

    // Normalize field names
    data.accuracy_pct = data.accuracy_rate;
    data.avg_actual_return_pct = data.avg_actual_return;
    data.max_drawdown_pct = data.max_drawdown;

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") throw new Error("Backtest timed out after 150s.");
    throw err;
  }
}

// ============================================================
// Monitor API (REST Polling)
// ============================================================

export interface MonitorToken {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  current_price: number;
  last_price: number;
  change_pct: number;
  alert_threshold: number;
  price_history: number[];
  added_at: number;
}

export interface MonitorAlert {
  address: string;
  symbol: string;
  change_pct: number;
  direction: string;
  timestamp: number;
  reanalyzed: boolean;
  new_score?: number;
}

export interface MonitorPollResponse {
  tokens: MonitorToken[];
  total: number;
  alerts: MonitorAlert[];
  timestamp: number;
}

export async function monitorSubscribe(
  address: string,
  chain?: string
): Promise<{ success: boolean; symbol: string; name: string; chain: string; current_price: number; message: string }> {
  const response = await fetch(`${API_BASE}/monitor/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chain }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function monitorUnsubscribe(address: string): Promise<void> {
  await fetch(
    `${API_BASE}/monitor/unsubscribe?address=${encodeURIComponent(address)}`,
    {
      method: "DELETE",
      signal: AbortSignal.timeout(10000),
    }
  );
}

// ============================================================
// Utility Functions (exported for backward compatibility)
// ============================================================

export function formatMC(value: number): string {
  if (!value || isNaN(value)) return "$0";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!value || isNaN(value)) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

export function formatChange(value: number): string {
  if (!value || isNaN(value)) return "0.00%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function shortenAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export async function monitorPoll(): Promise<MonitorPollResponse> {
  const response = await fetch(`${API_BASE}/monitor/prices`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
