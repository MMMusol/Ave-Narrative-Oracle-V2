/**
 * Ave Narrative Oracle — Backtest Page
 * Design: Premium Apple-inspired · Data-dense analytics layout
 * Feature: 6-month historical backtest, accuracy chart, monthly breakdown, signal distribution
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FlaskConical, ArrowLeft, Loader2, AlertCircle,
  TrendingUp, CheckCircle2, XCircle, BarChart2,
  Calendar, Target, Zap, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  runBacktest, formatMC, shortenAddress,
  type BacktestResponse, type BacktestDataPoint
} from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, BarChart, Bar, Cell, Legend,
  ComposedChart, Area
} from "recharts";

// ============================================================
// Helpers
// ============================================================
function AccuracyBadge({ pct }: { pct: number }) {
  const color = pct >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : pct >= 55 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {pct >= 70 ? <CheckCircle2 className="w-3 h-3" /> : pct >= 55 ? <Target className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {pct.toFixed(1)}% Accuracy
    </span>
  );
}

function SignalBadge({ signal }: { signal: "BUY" | "HOLD" | "SELL" }) {
  const styles = {
    BUY: "bg-emerald-50 text-emerald-700 border-emerald-200",
    HOLD: "bg-amber-50 text-amber-700 border-amber-200",
    SELL: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${styles[signal]}`}>
      {signal}
    </span>
  );
}

const SIGNAL_COLORS = { BUY: "#16a34a", HOLD: "#d97706", SELL: "#dc2626" };

// ============================================================
// Custom tooltip for price/score chart
// ============================================================
function PriceScoreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as BacktestDataPoint;
  return (
    <div className="bg-white border border-[#E5E5EA] rounded-xl p-3 shadow-sm text-xs">
      <p className="font-semibold text-[#1D1D1F] mb-1">{d?.date}</p>
      <p className="text-[#86868B]">Price: <span className="text-[#1D1D1F] font-mono">${d?.price?.toFixed(6)}</span></p>
      <p className="text-[#86868B]">Score: <span className="text-[#1D1D1F] font-mono">{d?.score?.toFixed(1)}</span></p>
      <p className="text-[#86868B]">Signal: <span className="font-bold" style={{ color: SIGNAL_COLORS[d?.signal] }}>{d?.signal}</span></p>
      <p className="text-[#86868B]">Correct: <span className={d?.correct ? "text-emerald-600" : "text-red-500"}>{d?.correct ? "✓" : "✗"}</span></p>
    </div>
  );
}

// ============================================================
// Main Backtest Page
// ============================================================
export default function Backtest() {
  const [, setLocation] = useLocation();
  const [address, setAddress] = useState("");
  const [period, setPeriod] = useState<90 | 180>(180);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAllPoints, setShowAllPoints] = useState(false);

  const handleRun = async () => {
    const addr = address.trim();
    if (!addr) {
      toast.error("Please enter a contract address");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    try {
      const data = await runBacktest(addr, period);
      setResult(data);
      toast.success(`Backtest complete — ${data.accuracy_pct.toFixed(1)}% accuracy over ${data.period_days} days`);
    } catch (err: any) {
      setError(err.message || "Backtest failed");
      toast.error("Backtest failed", { description: err.message });
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = result?.data_points ?? [];
  const displayedPoints = showAllPoints ? chartData : chartData.slice(-20);

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
              <FlaskConical className="w-4 h-4 text-[#1D1D1F]" />
              <span className="font-semibold text-[#1D1D1F] text-sm">Historical Backtest</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-1">Model Backtest Engine</h1>
          <p className="text-sm text-[#86868B]">
            Simulate Ave Oracle's math model on historical on-chain data. Evaluate prediction accuracy, Sharpe ratio, and signal distribution over the past 3–6 months.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#86868B] mb-1.5 block">Contract Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter contract address (0x...)"
                className="font-mono text-sm h-10 bg-[#FBFBFD] border-[#E5E5EA]"
                onKeyDown={(e) => e.key === "Enter" && handleRun()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#86868B] mb-1.5 block">Backtest Period</label>
              <div className="flex gap-2">
                {([90, 180] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-all ${
                      period === p
                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                        : "bg-white text-[#86868B] border-[#E5E5EA] hover:border-[#1D1D1F]"
                    }`}
                  >
                    {p}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[#86868B] bg-[#F5F5F7] px-2.5 py-1.5 rounded-full">
              <Info className="w-3 h-3" />
              Uses AVE Claw historical OHLCV data + math model simulation
            </div>
            <Button
              onClick={handleRun}
              disabled={isLoading}
              className="h-10 px-6 bg-[#000000] hover:bg-[#1D1D1F] text-white text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running... {elapsed}s
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  Run Backtest
                </span>
              )}
            </Button>
          </div>
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
            {/* KPI banner */}
            <div className="bg-[#1D1D1F] rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-lg font-semibold">{result.symbol}</h3>
                    <Badge className="bg-white/10 text-white border-white/20 text-[10px]">{result.chain.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-white/60">{result.name} · {result.period_days}-day backtest · {result.total_predictions} predictions</p>
                </div>
                <AccuracyBadge pct={result.accuracy_pct} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Accuracy", value: `${result.accuracy_pct.toFixed(1)}%`, sub: `${result.correct_predictions}/${result.total_predictions} correct`, color: result.accuracy_pct >= 70 ? "#4ade80" : result.accuracy_pct >= 55 ? "#fbbf24" : "#f87171" },
                  { label: "Sharpe Ratio", value: result.sharpe_ratio.toFixed(2), sub: result.sharpe_ratio >= 2 ? "Excellent" : result.sharpe_ratio >= 1 ? "Good" : "Below avg", color: result.sharpe_ratio >= 2 ? "#4ade80" : "#fbbf24" },
                  { label: "Max Drawdown", value: `-${result.max_drawdown_pct.toFixed(1)}%`, sub: "Peak-to-trough", color: result.max_drawdown_pct <= 30 ? "#4ade80" : result.max_drawdown_pct <= 60 ? "#fbbf24" : "#f87171" },
                  { label: "Avg Return", value: `${result.avg_actual_return_pct >= 0 ? "+" : ""}${result.avg_actual_return_pct.toFixed(1)}%`, sub: "7-day avg actual", color: result.avg_actual_return_pct >= 0 ? "#4ade80" : "#f87171" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-white/50 mb-1">{kpi.label}</div>
                    <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{kpi.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Price + Score chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Price vs Narrative Score
                  </h3>
                  <button
                    onClick={() => setShowAllPoints(!showAllPoints)}
                    className="text-xs text-[#86868B] hover:text-[#1D1D1F] flex items-center gap-1 transition-colors"
                  >
                    {showAllPoints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAllPoints ? "Show less" : "Show all"}
                  </button>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={displayedPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F7" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: "#86868B" }}
                        tickFormatter={(v) => v.slice(5)}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="score"
                        orientation="right"
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: "#86868B" }}
                        label={{ value: "Score", angle: 90, position: "insideRight", fontSize: 9, fill: "#86868B" }}
                      />
                      <YAxis
                        yAxisId="price"
                        orientation="left"
                        tick={{ fontSize: 9, fill: "#86868B" }}
                        tickFormatter={(v) => v < 0.001 ? v.toExponential(1) : v.toFixed(4)}
                      />
                      <Tooltip content={<PriceScoreTooltip />} />
                      <ReferenceLine yAxisId="score" y={50} stroke="#E5E5EA" strokeDasharray="4 4" />
                      <Area
                        yAxisId="price"
                        type="monotone"
                        dataKey="price"
                        stroke="#86868B"
                        fill="#F5F5F7"
                        strokeWidth={1.5}
                        dot={false}
                        name="Price"
                      />
                      <Line
                        yAxisId="score"
                        type="monotone"
                        dataKey="score"
                        stroke="#000000"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const d = props.payload as BacktestDataPoint;
                          return (
                            <circle
                              key={props.key}
                              cx={props.cx}
                              cy={props.cy}
                              r={3}
                              fill={d.correct ? "#16a34a" : "#dc2626"}
                              stroke="white"
                              strokeWidth={1}
                            />
                          );
                        }}
                        name="Score"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-[#86868B]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Correct prediction</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Incorrect prediction</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-black inline-block" /> Narrative score</span>
                </div>
              </div>

              {/* Signal distribution */}
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Signal Distribution
                </h3>
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(result.signal_distribution).map(([signal, count]) => ({
                        signal,
                        count,
                      }))}
                    >
                      <XAxis dataKey="signal" tick={{ fontSize: 10, fill: "#86868B" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#86868B" }} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #E5E5EA",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {Object.keys(result.signal_distribution).map((signal) => (
                          <Cell key={signal} fill={SIGNAL_COLORS[signal as keyof typeof SIGNAL_COLORS]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {Object.entries(result.signal_distribution).map(([signal, count]) => {
                    const total = Object.values(result.signal_distribution).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? (count / total * 100).toFixed(0) : "0";
                    return (
                      <div key={signal} className="flex items-center justify-between text-xs">
                        <SignalBadge signal={signal as any} />
                        <span className="text-[#1D1D1F] font-medium">{count} <span className="text-[#86868B]">({pct}%)</span></span>
                      </div>
                    );
                  })}
                </div>

                {/* Benchmark comparison */}
                {result.benchmark_comparison && Object.keys(result.benchmark_comparison).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#F5F5F7]">
                    <p className="text-[10px] font-semibold text-[#86868B] mb-2">vs. Benchmarks</p>
                    {Object.entries(result.benchmark_comparison).map(([name, bench]) => (
                      <div key={name} className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#86868B]">{name}</span>
                        <span className={`font-medium ${result.accuracy_pct > bench.accuracy ? "text-emerald-600" : "text-red-500"}`}>
                          {result.accuracy_pct > bench.accuracy ? "+" : ""}{(result.accuracy_pct - bench.accuracy).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly accuracy */}
            {result.monthly_accuracy.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Monthly Accuracy Breakdown
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.monthly_accuracy}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F7" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#86868B" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#86868B" }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #E5E5EA",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                        formatter={(v: any) => [`${v.toFixed(1)}%`, "Accuracy"]}
                      />
                      <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="4 4" label={{ value: "70% target", fontSize: 9, fill: "#16a34a" }} />
                      <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                        {result.monthly_accuracy.map((m, i) => (
                          <Cell key={i} fill={m.accuracy >= 70 ? "#16a34a" : m.accuracy >= 55 ? "#d97706" : "#dc2626"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#F5F5F7]">
                        <th className="text-left py-2 text-[#86868B] font-medium">Month</th>
                        <th className="text-right py-2 text-[#86868B] font-medium">Predictions</th>
                        <th className="text-right py-2 text-[#86868B] font-medium">Correct</th>
                        <th className="text-right py-2 text-[#86868B] font-medium">Accuracy</th>
                        <th className="text-right py-2 text-[#86868B] font-medium">vs Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monthly_accuracy.map((m, i) => (
                        <tr key={i} className="border-b border-[#F5F5F7] last:border-0">
                          <td className="py-2 font-medium text-[#1D1D1F]">{m.month}</td>
                          <td className="py-2 text-right text-[#86868B]">{m.total}</td>
                          <td className="py-2 text-right text-[#86868B]">{m.correct}</td>
                          <td className="py-2 text-right">
                            <AccuracyBadge pct={m.accuracy} />
                          </td>
                          <td className={`py-2 text-right font-medium ${m.accuracy >= 70 ? "text-emerald-600" : "text-red-500"}`}>
                            {m.accuracy >= 70 ? "+" : ""}{(m.accuracy - 70).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Model info */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#86868B] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#86868B]">
                <strong className="text-[#1D1D1F]">Model: {result.model_version}</strong> — 
                Backtest uses historical OHLCV data from AVE Claw Monitoring Skill, simulating the composite non-linear scoring formula 
                (β₁=0.28, β₂=0.16, Sigmoid activation) on each 7-day window. A prediction is "correct" if the model's BUY/HOLD/SELL signal 
                aligns with the actual 7-day price direction. Past performance does not guarantee future results.
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
