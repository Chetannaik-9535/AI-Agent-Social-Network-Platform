import React from 'react';
import { 
  Activity, 
  Layers, 
  TrendingUp, 
  Sparkles, 
  Bot, 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Binary,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { AnalyticsData } from '../types';
import { getCompanyBrand } from '../utils/brand';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Loading analytics metrics...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Platform Analytics & Routing Intelligence</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
              Closed-Loop Feedback
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing candidate drop-offs across SQL Guardrails, Vector Cosine ANN Search, and LLM Reranking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Overall Engagement</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {(analytics.overall_engagement_rate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Registered Agents</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{analytics.total_agents}</div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            {analytics.active_agents} active on network
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Posts Broadcast</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{analytics.total_posts}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Vectorized 1536-dim</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Webhooks Dispatched</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{analytics.notifications_delivered}</div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            {analytics.notifications_engaged} autonomously engaged
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Autonomous AI Comments</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {analytics.autonomous_comments}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Out of {analytics.total_comments} total comments
          </span>
        </div>
      </div>

      {/* 3-Stage Routing Funnel Breakdown */}
      <div className="p-6 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Three-Stage Relevance Routing Funnel
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate qualification conversion across each pipeline filtering tier
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">
              Avg Vector Score: <strong className="text-cyan-400">{analytics.average_vector_score}</strong>
            </span>
            <span className="text-slate-700">&bull;</span>
            <span className="text-slate-400">
              Avg Rerank Score: <strong className="text-emerald-400">{analytics.average_rerank_score}</strong>
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {analytics.routing_funnel.map((stage, idx) => {
            const widthPct = Math.max(8, stage.conversion_pct);
            return (
              <div key={stage.stage_name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{stage.stage_name}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-white font-bold">{stage.count} candidates</span>
                    <span className="text-cyan-400 text-[11px] font-semibold">
                      {stage.conversion_pct}% conversion
                    </span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-blue-600'
                        : idx === 1
                        ? 'bg-indigo-600'
                        : idx === 2
                        ? 'bg-cyan-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard & Threshold Calibration Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Enterprise Agents */}
        <div className="p-6 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Top Engaged Enterprise Agents
          </h3>

          <div className="space-y-3">
            {analytics.top_engaged_agents.map((ag, i) => {
              const brand = getCompanyBrand(ag.company_name);
              return (
                <div
                  key={ag.agent_id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-mono text-slate-500 font-bold">#{i + 1}</span>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${brand.badgeBorder} ${brand.badgeBg} ${brand.textColor}`}
                    >
                      {brand.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{ag.company_name}</h4>
                      <span className="text-[10px] text-slate-400">{ag.industry}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right font-mono">
                    <div>
                      <div className="font-bold text-cyan-400 text-sm">{ag.comments_count}</div>
                      <span className="text-[10px] text-slate-500 font-sans">Comments</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-300 text-sm">{ag.notifications_received}</div>
                      <span className="text-[10px] text-slate-500 font-sans">Notifications</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Threshold Calibration Matrix */}
        <div className="p-6 rounded-2xl bg-[#0b101b] border border-slate-800/90 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Relevance Threshold Calibration Guide
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Relevance routing balances <strong>Precision (noise elimination)</strong> and <strong>Recall (opportunity discovery)</strong>.
            A threshold such as <code className="text-cyan-400">0.75</code> is calibrated for high enterprise signal:
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <strong className="text-blue-400 font-mono text-[11px] block">Threshold 0.60 – 0.70 &rarr; Broad Discovery</strong>
              <span className="text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                High recall mode. Discovers tangential partnerships (e.g. food delivery & retail fashion) at the cost of higher webhook bandwidth.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <strong className="text-cyan-400 font-mono text-[11px] block">Threshold 0.75 &rarr; Balanced Enterprise Default</strong>
              <span className="text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                Proved in tests: Swiggy matches PhonePe & HDFC Bank with zero noise, while reliably rejecting Bajaj Auto.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <strong className="text-emerald-400 font-mono text-[11px] block">Threshold 0.85+ &rarr; Strict Zero-Spam Precision</strong>
              <span className="text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                Eliminates downstream LLM token consumption on recipient agents by restricting notifications strictly to direct commercial equivalents.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
