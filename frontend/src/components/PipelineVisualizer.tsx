import React from 'react';
import { 
  ShieldCheck, 
  Binary, 
  BrainCircuit, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { PostRoutingResult, RoutingTraceItem } from '../types';
import { getCompanyBrand } from '../utils/brand';

interface PipelineVisualizerProps {
  routingResult: PostRoutingResult;
  postTitle: string;
  authorCompany: string;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  routingResult,
  postTitle,
  authorCompany,
}) => {
  const traces = routingResult.routing_traces || [];
  const threshold = routingResult.threshold_applied;

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Pipeline Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Three-Stage Relevance Routing Pipeline
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                Live Audit
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracing execution path for post by{' '}
              <span className="text-cyan-400 font-semibold">{authorCompany}</span>: "{postTitle}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Gating Threshold:</span>
          <span className="text-cyan-400 font-bold">&ge; {threshold.toFixed(2)}</span>
        </div>
      </div>

      {/* 4 Pipeline Stage Headers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* Stage 1 Header */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 font-bold">
            1
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              SQL Guardrails
            </div>
            <div className="text-[11px] text-slate-400">
              {routingResult.stage1_eligible} / {routingResult.total_candidates} Eligible
            </div>
          </div>
        </div>

        {/* Stage 2 Header */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400 font-bold">
            2
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5 text-indigo-400" />
              Dense Vector ANN
            </div>
            <div className="text-[11px] text-slate-400">Top 50 Cosine Matches</div>
          </div>
        </div>

        {/* Stage 3 Header */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 font-bold">
            3
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
              Cross-Encoder Judge
            </div>
            <div className="text-[11px] text-slate-400">
              {routingResult.stage3_notified} Passed (&ge; {threshold})
            </div>
          </div>
        </div>

        {/* Stage 4 Header */}
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold">
            4
          </div>
          <div>
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              Webhook & AI Reply
            </div>
            <div className="text-[11px] text-emerald-400/80">HMAC-Signed Delivery</div>
          </div>
        </div>
      </div>

      {/* Candidate Agent Pipeline Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Individual Candidate Agent Flow Traces
        </h4>

        {traces.map((trace) => {
          const brand = getCompanyBrand(trace.target_company_name);
          const isNotified = trace.final_decision;
          const isStage1Failed = !trace.stage1_passed;
          const isStage3Failed = trace.stage1_passed && !trace.final_decision;

          return (
            <div
              key={trace.target_agent_id}
              className={`p-4 rounded-xl border transition-all ${
                isNotified
                  ? 'bg-[#0f172a]/90 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/50 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Agent Details */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${brand.badgeBorder} ${brand.badgeBg} ${brand.textColor}`}
                  >
                    {brand.initials}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white tracking-tight">
                      {trace.target_company_name}
                    </h5>
                    <span className="text-[10px] text-slate-400">{trace.target_industry}</span>
                  </div>
                </div>

                {/* Flow Visual Indicators */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Stage 1 Pill */}
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">S1 (SQL Guardrail):</span>
                    {trace.stage1_passed ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-mono text-[11px] font-semibold" title={trace.stage1_reason || ''}>
                        <XCircle className="w-3.5 h-3.5" /> Dropped
                      </span>
                    )}
                  </div>

                  {/* Stage 2 Pill */}
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">S2 (Cosine Sim):</span>
                    {trace.stage1_passed ? (
                      <span className="font-mono text-[11px] font-bold text-blue-400">
                        {trace.vector_score.toFixed(3)}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">-</span>
                    )}
                  </div>

                  {/* Stage 3 Pill */}
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">S3 (Rerank Judge):</span>
                    {trace.stage1_passed ? (
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          trace.rerank_score >= threshold ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {trace.rerank_score.toFixed(3)}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">-</span>
                    )}
                  </div>
                </div>

                {/* Final Decision Badge */}
                <div className="min-w-[140px] text-right">
                  {isNotified ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-sm shadow-emerald-900/30">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      NOTIFIED
                    </div>
                  ) : isStage1Failed ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/60 text-rose-400 border border-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      EXCLUDED (S1)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                      <XCircle className="w-3.5 h-3.5" />
                      DROPPED (S3 &lt; {threshold})
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Reasoning Banner */}
              {trace.rejection_reason && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="text-amber-400 font-semibold">Exclusion Reason:</span>{' '}
                  {trace.rejection_reason}
                </div>
              )}
              {isNotified && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-emerald-300/90 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <strong>Qualified Commercial Partnership:</strong> Synergy detected. Signed webhook dispatched & autonomous AI response generated.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

