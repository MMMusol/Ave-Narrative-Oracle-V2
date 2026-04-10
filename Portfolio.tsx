/**
 * Ave Narrative Oracle — Portfolio Comparison Page
 * Design: Premium Apple-inspired · Clean data-dense layout
 * Feature: Compare 3-5 tokens, radar chart overlay, position suggestions
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Plus, Trash2, ArrowLeft, Loader2, AlertCircle,
  TrendingUp, TrendingDown, Shield, Zap, Target, Scale,
  ChevronRight, Star, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  comparePortfolio, formatMC, formatNumber, shortenAddress,
  type PortfolioToken, type PositionSuggestion, type PortfolioCompareResponse
} from "@/lib/api";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, Cell
} from "recharts";

// ============================================================
// Color palette for multi-token comparison
// ============================================================
const TOKEN_COLORS = [
  "#000000", "#2563eb", "#16a34a", "#dc2626", "#9333ea",
];

const SCORE_COLORS = {
  high: "#16a34a",
  medium: "#d97706",
  low: "#dc2626",
};

function getScoreColor(score: number) {
  if (score >= 70) return SCORE_COLORS.high;
  if (score >= 45) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Strong Buy";
  if (score >= 65) return "Buy";
  if (score >= 50) return "Neutral";
  if (score >= 35) return "Caution";
  return "Avoid";
}

// ============================================================
// Sub-components
// ============================================================
function TokenInputRow({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: TOKEN_COLORS[index] }}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Token ${index + 1} contract address (0x...)`}
        className="flex-1 font-mono text-sm h-9 bg-[#FBFBFD] border-[#E5E5EA]"
      />
      {canRemove && (
        <button
          onClick={onRemove}
          className="text-[#86868B] hover:text-red-500 transition-colors p-1 flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function ScoreBar({ score, symbol, color }: { score: number; symbol: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#1D1D1F]">{symbol}</span>
        <span className="font-mono font-semibold" style={{ color }}>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function TokenCard({
  token,
  color,
  rank,
}: {
  token: PortfolioToken;
  color: string;
  rank: number;
}) {
  const isUp = (token.price_change_24h ?? 0) >= 0;
  const scoreColor = getScoreColor(token.final_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-white rounded-2xl border border-[#E5E5EA] p-5 relative overflow-hidden"
    >
      {/* Color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: color }} />

      {/* Rank badge */}
      <div
        className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {rank + 1}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-[#1D1D1F] text-base">{token.symbol}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wide">
            {token.chain}
          </Badge>
        </div>
        <p className="text-xs text-[#86868B]">{token.name}</p>
        <p className="text-[10px] text-[#86868B] font-mono mt-0.5">{shortenAddress(token.address)}</p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-center">
          <div
            className="text-3xl font-bold font-mono"
            style={{ color: scoreColor }}
          >
            {token.final_score.toFixed(1)}
          </div>
          <div className="text-[10px] text-[#86868B] mt-0.5">Narrative Score</div>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#86868B]">Breakout</span>
            <span className="font-medium text-[#1D1D1F]">{(token.breakout_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#86868B]">Hold Score</span>
            <span className="font-medium text-[#1D1D1F]">{token.hold_value_score.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#86868B]">Risk</span>
            <span className={`font-medium ${token.contract_risk_score <= 3 ? "text-emerald-600" : token.contract_risk_score <= 6 ? "text-amber-600" : "text-red-500"}`}>
              {token.contract_risk_score}/10
            </span>
          </div>
        </div>
      </div>

      {/* Market data */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#F5F5F7] rounded-lg p-2">
          <div className="text-[#86868B] mb-0.5">Market Cap</div>
          <div className="font-semibold text-[#1D1D1F]">{formatMC(token.market_cap)}</div>
        </div>
        <div className="bg-[#F5F5F7] rounded-lg p-2">
          <div className="text-[#86868B] mb-0.5">24h Change</div>
          <div className={`font-semibold flex items-center gap-0.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(token.price_change_24h ?? 0).toFixed(2)}%
          </div>
        </div>
        <div className="bg-[#F5F5F7] rounded-lg p-2">
          <div className="text-[#86868B] mb-0.5">Holders</div>
          <div className="font-semibold text-[#1D1D1F]">{formatNumber(token.holders ?? 0)}</div>
        </div>
        <div className="bg-[#F5F5F7] rounded-lg p-2">
          <div className="text-[#86868B] mb-0.5">Peak MC Est.</div>
          <div className="font-semibold text-[#1D1D1F]">{formatMC(token.peak_mc_high)}</div>
        </div>
      </div>

      {/* Signal */}
      <div className="mt-3 pt-3 border-t border-[#F5F5F7] flex items-center justify-between">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: `${scoreColor}15`,
            color: scoreColor,
          }}
        >
          {getScoreLabel(token.final_score)}
        </span>
        <span className="text-[10px] text-[#86868B] line-clamp-1 max-w-[140px]">
          {token.ai_summary.slice(0, 60)}...
        </span>
      </div>
    </motion.div>
  );
}

function PositionCard({ suggestion, rank }: { suggestion: PositionSuggestion; rank: number }) {
  const color = TOKEN_COLORS[rank] || "#86868B";
  const actionColor = suggestion.action === "Overweight"
    ? "#16a34a"
    : suggestion.action === "Underweight"
    ? "#dc2626"
    : "#d97706";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#F5F5F7] last:border-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {rank + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#1D1D1F]">{suggestion.symbol}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{suggestion.chain}</Badge>
        </div>
        <p className="text-xs text-[#86868B] truncate">{suggestion.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-bold text-[#1D1D1F]">{suggestion.suggested_weight_pct}%</div>
        <div
          className="text-[10px] font-medium"
          style={{ color: actionColor }}
        >
          {suggestion.action}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Portfolio Page
// ============================================================
export default function Portfolio() {
  const [, setLocation] = useLocation();
  const [addresses, setAddresses] = useState<string[]>(["", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PortfolioCompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const handleAddAddress = () => {
    if (addresses.length < 5) {
      setAddresses([...addresses, ""]);
    }
  };

  const handleRemoveAddress = (i: number) => {
    if (addresses.length > 2) {
      setAddresses(addresses.filter((_, idx) => idx !== i));
    }
  };

  const handleAnalyze = async () => {
    const validAddresses = addresses.filter((a) => a.trim().length > 0);
    if (validAddresses.length < 2) {
      toast.error("Please enter at least 2 contract addresses");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    try {
      const data = await comparePortfolio(validAddresses);
      setResult(data);
      toast.success(`Portfolio analysis complete — ${data.tokens.length} tokens compared`);
    } catch (err: any) {
      setError(err.message || "Portfolio analysis failed");
      toast.error("Analysis failed", { description: err.message });
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  // Sort tokens by score for ranking
  const sortedTokens = result
    ? [...result.tokens].sort((a, b) => b.final_score - a.final_score)
    : [];

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="w-px h-4 bg-[#E5E5EA]" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1D1D1F]" />
              <span className="font-semibold text-[#1D1D1F] text-sm">Portfolio Compare</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-1">Portfolio Narrative Comparison</h1>
          <p className="text-sm text-[#86868B]">
            Compare 2–5 tokens simultaneously. Ave Oracle runs parallel MiniMax-M2 analysis and generates position allocation suggestions.
          </p>
        </div>

        {/* Input section */}
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1D1D1F]">Token Addresses</h2>
            <span className="text-xs text-[#86868B]">{addresses.filter(a => a.trim()).length} / 5 entered</span>
          </div>

          <div className="space-y-2.5 mb-4">
            {addresses.map((addr, i) => (
              <TokenInputRow
                key={i}
                index={i}
                value={addr}
                onChange={(v) => {
                  const next = [...addresses];
                  next[i] = v;
                  setAddresses(next);
                }}
                onRemove={() => handleRemoveAddress(i)}
                canRemove={addresses.length > 2}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {addresses.length < 5 && (
              <button
                onClick={handleAddAddress}
                className="flex items-center gap-1.5 text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add token (max 5)
              </button>
            )}
            <div className="flex-1" />
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="h-10 px-6 bg-[#000000] hover:bg-[#1D1D1F] text-white text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing... {elapsed}s
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Compare Portfolio
                </span>
              )}
            </Button>
          </div>

          {isLoading && (
            <div className="mt-4 p-3 bg-[#F5F5F7] rounded-xl">
              <p className="text-xs text-[#86868B]">
                Running parallel MiniMax-M2 analysis on {addresses.filter(a => a.trim()).length} tokens.
                Each token takes ~30s — total estimated: ~{addresses.filter(a => a.trim()).length * 30}s
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary banner */}
            <div className="bg-[#1D1D1F] rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Portfolio Summary</h3>
                  <p className="text-sm text-white/60">
                    {result.summary.total_tokens} tokens analyzed · Best: <strong className="text-white">{result.summary.best_token}</strong>
                  </p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.summary.avg_score.toFixed(1)}</div>
                    <div className="text-xs text-white/60">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{result.summary.max_score.toFixed(1)}</div>
                    <div className="text-xs text-white/60">Best Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{result.summary.min_score.toFixed(1)}</div>
                    <div className="text-xs text-white/60">Lowest Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Token cards grid */}
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Token Rankings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {sortedTokens.map((token, i) => (
                  <TokenCard
                    key={token.address}
                    token={token}
                    color={TOKEN_COLORS[i]}
                    rank={i}
                  />
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar chart */}
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Narrative Dimensions Comparison
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={result.radar_comparison}>
                      <PolarGrid stroke="#E5E5EA" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fontSize: 10, fill: "#86868B" }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 10]}
                        tick={{ fontSize: 9, fill: "#86868B" }}
                      />
                      {sortedTokens.map((token, i) => (
                        <Radar
                          key={token.address}
                          name={token.symbol}
                          dataKey={token.symbol}
                          stroke={TOKEN_COLORS[i]}
                          fill={TOKEN_COLORS[i]}
                          fillOpacity={0.08}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #E5E5EA",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Score bar chart */}
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Final Narrative Score
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedTokens.map((t, i) => ({
                        symbol: t.symbol,
                        score: parseFloat(t.final_score.toFixed(1)),
                        color: TOKEN_COLORS[i],
                      }))}
                      layout="vertical"
                      margin={{ left: 10, right: 30 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#86868B" }} />
                      <YAxis dataKey="symbol" type="category" tick={{ fontSize: 11, fill: "#1D1D1F" }} width={60} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #E5E5EA",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                        {sortedTokens.map((_, i) => (
                          <Cell key={i} fill={TOKEN_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Position suggestions */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  AI Position Allocation Suggestions
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-[#86868B] bg-[#F5F5F7] px-2.5 py-1.5 rounded-full">
                  <Info className="w-3 h-3" />
                  Risk-adjusted weights based on narrative score
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {result.position_suggestions.map((s, i) => (
                    <PositionCard key={s.symbol} suggestion={s} rank={i} />
                  ))}
                </div>

                {/* Pie-like visual */}
                <div className="space-y-3">
                  <p className="text-xs text-[#86868B] mb-3">Suggested portfolio weight distribution:</p>
                  {result.position_suggestions.map((s, i) => (
                    <ScoreBar
                      key={s.symbol}
                      score={s.suggested_weight_pct}
                      symbol={`${s.symbol} (${s.suggested_weight_pct}%)`}
                      color={TOKEN_COLORS[i] || "#86868B"}
                    />
                  ))}
                  <p className="text-[10px] text-[#86868B] mt-4 pt-3 border-t border-[#F5F5F7]">
                    ⚠️ This is algorithmic analysis only, not financial advice. Always DYOR and manage risk appropriately.
                  </p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">Some tokens could not be analyzed:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">
                    {typeof e === 'string' ? e : `${shortenAddress((e as any).address)}: ${(e as any).error}`}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
