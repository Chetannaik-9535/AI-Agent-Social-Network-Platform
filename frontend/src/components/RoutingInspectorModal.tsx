import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Layers, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Post, PostRoutingResult, RoutingTraceItem } from '../types';
import { api } from '../services/api';

interface RoutingInspectorModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RoutingInspectorModal: React.FC<RoutingInspectorModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const [threshold, setThreshold] = useState<number>(0.75);
  const [loading, setLoading] = useState<boolean>(false);
  const [routingResult, setRoutingResult] = useState<PostRoutingResult | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'notified' | 'rejected'>('all');

  useEffect(() => {
    if (post && isOpen) {
      loadSimulation(threshold);
    }
  }, [post, isOpen]);

  const loadSimulation = async (thr: number) => {
    if (!post) return;
    setLoading(true);
    try {
      const res = await api.simulatePostRouting(post.id, thr);
      setRoutingResult(res);
    } catch (err) {
      console.error('Failed to simulate routing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (newVal: number) => {
    setThreshold(newVal);
    loadSimulation(newVal);
  };

  if (!isOpen || !post) return null;

  const traces = routingResult?.routing_traces || [];
  const filteredTraces = traces.filter((t) => {
    if (filterMode === 'notified') return t.final_decision;
    if (filterMode === 'rejected') return !t.final_decision;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Relevance Routing Inspector</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  3-Stage Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditing post: <span className="text-slate-200 font-medium">"{post.title}"</span> by{' '}
                <span className="text-cyan-400 font-medium">{post.author_company_name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline Summary Bar */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block mb-1">
              Total Agents
            </span>
            <div className="text-xl font-bold text-white">{routingResult?.total_candidates ?? '-'}</div>
            <span className="text-[10px] text-slate-400">Registered candidates</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block mb-1">
              Stage 1 (SQL Guardrails)
            </span>
            <div className="text-xl font-bold text-cyan-400">{routingResult?.stage1_eligible ?? '-'}</div>
            <span className="text-[10px] text-slate-400">Active & non-blocked</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider block mb-1">
              Stage 2 (Vector ANN)
            </span>
            <div className="text-xl font-bold text-blue-400">{routingResult?.stage2_vector_matches ?? '-'}</div>
            <span className="text-[10px] text-slate-400">Dense Cosine Top K</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-900/50 bg-emerald-950/20">
            <span className="text-[11px] text-emerald-400 uppercase font-mono tracking-wider block mb-1">
              Stage 3 (Notified)
            </span>
            <div className="text-xl font-bold text-emerald-400">{routingResult?.stage3_notified ?? '-'}</div>
            <span className="text-[10px] text-emerald-300/80">Rerank score &ge; {threshold}</span>
          </div>
        </div>

        {/* Threshold Interactive Slider */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200">Relevance Threshold Calibrator:</span>
              <span className="text-xs text-slate-400 ml-1.5 font-mono text-cyan-400 font-bold">{threshold.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xs">
            <span className="text-[10px] text-slate-400 font-mono">0.50</span>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">0.95</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({traces.length})
            </button>
            <button
              onClick={() => setFilterMode('notified')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'notified' ? 'bg-emerald-950 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Notified ({routingResult?.stage3_notified ?? 0})
            </button>
            <button
              onClick={() => setFilterMode('rejected')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterMode === 'rejected' ? 'bg-rose-950 text-rose-400 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Excluded ({(routingResult?.total_candidates ?? 0) - (routingResult?.stage3_notified ?? 0)})
            </button>
          </div>
        </div>

        {/* Traces List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Zap className="w-8 h-8 animate-pulse text-cyan-500 mx-auto mb-2" />
              <p className="text-xs">Computing 3-Stage Routing decisions...</p>
            </div>
          ) : filteredTraces.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No agent traces matching current filter.
            </div>
          ) : (
            filteredTraces.map((trace) => {
              const isNotified = trace.final_decision;
              return (
                <div
                  key={trace.target_agent_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isNotified
                      ? 'bg-emerald-950/20 border-emerald-900/60 shadow-sm shadow-emerald-950/20'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isNotified ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isNotified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{trace.target_company_name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {trace.target_industry}
                          </span>
                          {isNotified ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              NOTIFIED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                              DROPPED
                            </span>
                          )}
                        </div>

                        {/* Stage Breakdown Badges */}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Stage 1 (SQL):</span>
                            {trace.stage1_passed ? (
                              <span className="text-emerald-400 font-mono text-[11px] font-medium">Passed</span>
                            ) : (
                              <span className="text-rose-400 font-mono text-[11px] font-medium">
                                Excluded ({trace.stage1_reason})
                              </span>
                            )}
                          </div>

                          {trace.stage1_passed && (
                            <>
                              <span className="text-slate-700">&bull;</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400">Stage 2 Vector:</span>
                                <span className="text-blue-400 font-mono text-[11px] font-medium">
                                  {trace.vector_score.toFixed(3)}
                                </span>
                              </div>

                              <span className="text-slate-700">&bull;</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400">Stage 3 Rerank:</span>
                                <span
                                  className={`font-mono text-[11px] font-bold ${
                                    trace.rerank_score >= threshold ? 'text-emerald-400' : 'text-amber-400'
                                  }`}
                                >
                                  {trace.rerank_score.toFixed(3)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Reasoning / Rejection Explanation */}
                        {trace.rejection_reason && (
                          <p className="mt-2 text-xs text-rose-300/80 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                            <strong>Reason:</strong> {trace.rejection_reason}
                          </p>
                        )}
                        {isNotified && (
                          <p className="mt-2 text-xs text-emerald-300/80 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                            <strong>Synergy:</strong> Verified commercial match. High partnership affinity with {post.author_company_name}.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Swiggy Diwali Offer demo: PhonePe & HDFC Bank qualify (&ge; 0.75), Bajaj Auto dropped (&lt; 0.75).</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

