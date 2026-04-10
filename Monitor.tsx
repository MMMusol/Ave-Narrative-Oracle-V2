/**
 * Ave Narrative Oracle — Real-time Monitor Page
 * Design: Premium Apple-inspired · Live polling transport
 * Transport: REST polling (15s) — replaces WebSocket for HTTP/2 proxy compatibility
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Bell, BellRing, Plus, X, Wifi, WifiOff,
  TrendingUp, TrendingDown, RefreshCw, ArrowLeft,
  Zap, Clock, Eye, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  monitorSubscribe, monitorUnsubscribe, monitorPoll,
  shortenAddress,
  type MonitorToken, type MonitorAlert
} from "@/lib/api";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const POLL_INTERVAL_MS = 15000;

// ─── Connection Badge ─────────────────────────────────────────
function ConnectionBadge({ status }: { status: "live" | "error" }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Live · 15s poll
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
      <WifiOff className="w-3.5 h-3.5" />
      Disconnected
    </span>
  );
}

// ─── Sparkline ────────────────────────────────────────────────
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={positive ? "#16a34a" : "#dc2626"} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Token Card ───────────────────────────────────────────────
function TokenCard({ token, onRemove }: { token: MonitorToken; onRemove: (addr: string) => void }) {
  const changePct = token.change_pct ?? 0;
  const isUp = changePct >= 0;
  const isAlert = Math.abs(changePct) >= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative bg-white rounded-2xl border p-5 transition-all ${
        isAlert ? "border-amber-300 shadow-amber-50 shadow-md" : "border-[#E5E5EA]"
      }`}
      style={{ boxShadow: isAlert ? undefined : "0 2px 12px rgba(0,0,0,0.02)" }}
    >
      {isAlert && (
        <div className="absolute top-3 right-10">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-[#1D1D1F] text-base" style={{ fontFamily: "Syne, sans-serif" }}>
              {token.symbol}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wide">
              {token.chain?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-[#86868B]">{token.name}</p>
          <p className="text-[10px] text-[#86868B] font-mono mt-0.5">{shortenAddress(token.address)}</p>
        </div>
        <button onClick={() => onRemove(token.address)} className="text-[#86868B] hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xs text-[#86868B] mb-0.5">Current Price</div>
          <div className="text-xl font-bold text-[#1D1D1F] font-mono">
            ${token.current_price < 0.001
              ? token.current_price.toExponential(3)
              : token.current_price < 1
              ? token.current_price.toFixed(6)
              : token.current_price.toFixed(4)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold font-mono flex items-center gap-1 ${isUp ? "text-emerald-600" : "text-red-500"}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isUp ? "+" : ""}{changePct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-[#86868B]">vs last poll</div>
        </div>
      </div>

      {token.price_history && token.price_history.length >= 2 && (
        <div className="mb-3">
          <Sparkline data={token.price_history} positive={isUp} />
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-[#86868B] pt-3 border-t border-[#F5F5F7]">
        <span className="flex items-center gap-1"><Bell className="w-3 h-3" />Alert at &gt;{token.alert_threshold ?? 5}%</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Monitoring</span>
      </div>
    </motion.div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────
function AlertItem({ alert }: { alert: MonitorAlert & { id: string } }) {
  const isUp = alert.direction === "up";
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 rounded-xl border text-xs ${isUp ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {isUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          <span className="font-semibold text-[#1D1D1F]">{alert.symbol}</span>
        </div>
        <span className={`font-mono font-bold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
          {isUp ? "+" : ""}{alert.change_pct.toFixed(2)}%
        </span>
      </div>
      {alert.reanalyzed && alert.new_score != null && (
        <div className="flex items-center gap-1 text-[#86868B] mt-1">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Reanalyzed → Score: <strong className="text-[#1D1D1F]">{alert.new_score.toFixed(1)}</strong></span>
        </div>
      )}
      <div className="text-[#86868B] mt-1 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {new Date(alert.timestamp * 1000).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Monitor() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"live" | "error">("live");
  const [tokens, setTokens] = useState<MonitorToken[]>([]);
  const [alerts, setAlerts] = useState<Array<MonitorAlert & { id: string }>>([]);
  const [inputAddress, setInputAddress] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenTimestamps = useRef<Set<number>>(new Set());

  const poll = useCallback(async () => {
    setIsPolling(true);
    try {
      const data = await monitorPoll();
      setTokens(data.tokens ?? []);
      setLastPoll(new Date());
      setStatus("live");

      const newAlerts = (data.alerts ?? []).filter((a) => !seenTimestamps.current.has(a.timestamp));
      if (newAlerts.length > 0) {
        newAlerts.forEach((a) => seenTimestamps.current.add(a.timestamp));
        const withIds = newAlerts.map((a) => ({ ...a, id: `${a.address}-${a.timestamp}` }));
        setAlerts((prev) => [...withIds, ...prev].slice(0, 50));
        withIds
          .filter((a) => Date.now() / 1000 - a.timestamp < 60)
          .forEach((a) => {
            toast(
              `${a.symbol} ${a.direction === "up" ? "surged" : "dropped"} ${Math.abs(a.change_pct).toFixed(1)}%`,
              {
                description: a.reanalyzed ? `MiniMax-M2 reanalysis → Score: ${a.new_score?.toFixed(1)}` : "Price alert triggered",
                icon: a.direction === "up" ? "📈" : "📉",
              }
            );
          });
      }
    } catch {
      setStatus("error");
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    poll();
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [poll]);

  const handleAddToken = async () => {
    const addr = inputAddress.trim();
    if (!addr) { toast.error("Please enter a contract address"); return; }
    if (tokens.some((t) => t.address.toLowerCase() === addr.toLowerCase())) {
      toast.info("Token already being monitored"); return;
    }
    setIsAdding(true);
    try {
      const result = await monitorSubscribe(addr);
      toast.success(`Now monitoring ${result.symbol}`, { description: result.message });
      setInputAddress("");
      await poll();
    } catch (err: any) {
      toast.error("Failed to add token", { description: err.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveToken = async (address: string) => {
    try { await monitorUnsubscribe(address); } catch {}
    setTokens((prev) => prev.filter((t) => t.address !== address));
    toast.success("Token removed from monitor");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              <ArrowLeft className="w-4 h-4" />Back
            </button>
            <div className="w-px h-4 bg-[#E5E5EA]" />
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1D1D1F]" />
              <span className="font-semibold text-[#1D1D1F] text-sm">Real-time Monitor</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastPoll && (
              <span className="text-[10px] text-[#86868B] hidden sm:block">
                Last sync: {lastPoll.toLocaleTimeString()}
              </span>
            )}
            <button onClick={poll} disabled={isPolling} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors p-1.5 rounded-lg hover:bg-[#F5F5F7]" title="Refresh now">
              <RefreshCw className={`w-4 h-4 ${isPolling ? "animate-spin" : ""}`} />
            </button>
            <ConnectionBadge status={status} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
            Real-time Narrative Monitor
          </h1>
          <p className="text-sm text-[#86868B]">
            Add tokens to monitor. When price changes &gt;5%, Ave Oracle automatically triggers a full MiniMax-M2 narrative reanalysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Add token + cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Add token */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />Add Token to Monitor
              </h3>
              <div className="flex gap-3">
                <Input
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  placeholder="Enter contract address (0x...)"
                  className="font-mono text-sm h-10 bg-[#FBFBFD] border-[#E5E5EA] flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddToken()}
                  disabled={isAdding}
                />
                <Button
                  onClick={handleAddToken}
                  disabled={isAdding || !inputAddress.trim()}
                  className="h-10 px-5 bg-[#000000] hover:bg-[#1D1D1F] text-white text-sm whitespace-nowrap"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Monitor</span>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] text-[#86868B]">Quick add:</span>
                {[
                  { label: "PEPE (ETH)", addr: "0x6982508145454Ce325dDbE47a25d4ec3d2311933" },
                  { label: "GIGGLE (BSC)", addr: "0x20d6015660b3fe52e6690a889b5c51f69902ce0e" },
                  { label: "BNB (BSC)", addr: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
                ].map((ex) => (
                  <button key={ex.addr} onClick={() => setInputAddress(ex.addr)}
                    className="text-[10px] text-[#86868B] hover:text-[#1D1D1F] underline underline-offset-2 transition-colors">
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Token cards */}
            {tokens.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-12 text-center">
                <Eye className="w-8 h-8 text-[#86868B] mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-[#86868B]">No tokens monitored yet</p>
                <p className="text-xs text-[#86868B] mt-1">Add a contract address above to start real-time monitoring</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {tokens.map((token) => (
                    <TokenCard key={token.address} token={token} onRemove={handleRemoveToken} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* How it works */}
            <div className="bg-[#F5F5F7] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-3">How it works</h3>
              <div className="space-y-2.5">
                {[
                  { icon: <Wifi className="w-3.5 h-3.5" />, label: "Poll every 15s", desc: "Frontend polls the backend for live price data every 15 seconds" },
                  { icon: <Activity className="w-3.5 h-3.5" />, label: "Backend monitors", desc: "AVE Claw Monitoring Skill checks on-chain price for each token every 30s" },
                  { icon: <AlertCircle className="w-3.5 h-3.5" />, label: ">5% change detected", desc: "Price alert fires immediately — you see it in the feed on the right" },
                  { icon: <Zap className="w-3.5 h-3.5" />, label: "Auto reanalysis", desc: "MiniMax-M2 runs a full narrative reanalysis and pushes the new score" },
                  { icon: <Bell className="w-3.5 h-3.5" />, label: "Result pushed", desc: "Updated score, breakout probability, and narrative summary appear instantly" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-white border border-[#E5E5EA] flex items-center justify-center text-[#86868B] flex-shrink-0 mt-0.5">
                      {step.icon}
                    </div>
                    <div>
                      <span className="font-medium text-[#1D1D1F]">{step.label}</span>
                      <span className="text-[#86868B]"> {step.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Alert feed + status */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                <BellRing className="w-4 h-4" />Alert Feed
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Monitored", value: tokens.length, color: "text-[#1D1D1F]" },
                  { label: "Alerts", value: alerts.length, color: alerts.length > 0 ? "text-amber-600" : "text-[#1D1D1F]" },
                  { label: "Reanalyzed", value: alerts.filter((a) => a.reanalyzed).length, color: "text-blue-600" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-[#86868B]">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-6 h-6 text-[#86868B] mx-auto mb-2 opacity-40" />
                      <p className="text-xs text-[#86868B]">No alerts yet</p>
                      <p className="text-[10px] text-[#86868B] mt-1">Alerts appear when price changes &gt;5%</p>
                    </div>
                  ) : (
                    alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Connection status card */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#1D1D1F]">Connection Status</span>
                <ConnectionBadge status={status} />
              </div>
              <div className="text-[10px] text-[#86868B] space-y-1.5">
                {[
                  ["Transport", "REST Polling"],
                  ["Frontend interval", "15 seconds"],
                  ["Backend check", "30 seconds"],
                  ["Alert threshold", ">5% price change"],
                  ...(lastPoll ? [["Last sync", lastPoll.toLocaleTimeString()]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="text-[#1D1D1F] font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
