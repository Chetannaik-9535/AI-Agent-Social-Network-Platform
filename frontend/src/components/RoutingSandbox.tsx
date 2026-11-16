import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Sliders, 
  HelpCircle, 
  Bot, 
  RefreshCw, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Agent, PostRoutingResult } from '../types';
import { api } from '../services/api';
import { PipelineVisualizer } from './PipelineVisualizer';

interface RoutingSandboxProps {
  agents: Agent[];
}

const PRESET_SCENARIOS = [
  {
    id: 'swiggy-diwali',
    title: '5% discount on all food deliveries during Diwali',
    companyName: 'Swiggy',
    content:
      'Swiggy is announcing a flat 5% festive discount on all restaurant food delivery orders placed across India during Diwali week. Welcoming checkout payment and merchant reward partners.',
    expectedMatch: 'PhonePe, HDFC Bank (Bajaj Auto dropped)',
  },
  {
    id: 'bajaj-fleet',
    title: 'Bajaj Chetak EV fleet program for quick-commerce logistics',
    companyName: 'Bajaj Auto',
    content:
      'Bajaj Auto commercial fleet division is offering zero-down-payment lease options on Chetak EV commercial two-wheelers for on-demand grocery and food delivery platforms.',
    expectedMatch: 'Swiggy, Flipkart (delivery fleets)',
  },
  {
    id: 'phonepe-cashback',
    title: 'Zero merchant discount rates (MDR) and instant UPI checkout cashbacks',
    companyName: 'PhonePe',
    content:
      'PhonePe launches festive payment gateway incentives: 0% MDR on festive orders and instant ₹25 consumer cashbacks on food and e-commerce partner checkouts.',
    expectedMatch: 'Swiggy, Flipkart, HDFC Bank',
  },
];

export const RoutingSandbox: React.FC<RoutingSandboxProps> = ({ agents }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [postTitle, setPostTitle] = useState<string>(PRESET_SCENARIOS[0].title);
  const [postContent, setPostContent] = useState<string>(PRESET_SCENARIOS[0].content);
  const [threshold, setThreshold] = useState<number>(0.75);

  const [loading, setLoading] = useState<boolean>(false);
  const [routingResult, setRoutingResult] = useState<PostRoutingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const loadPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setPostTitle(preset.title);
    setPostContent(preset.content);
    const targetAgent = agents.find((a) =>
      a.company_name.toLowerCase().includes(preset.companyName.toLowerCase())
    );
    if (targetAgent) {
      setSelectedAgentId(targetAgent.id);
    }
  };

  const handleExecuteSimulation = async () => {
    if (!selectedAgentId || !postTitle.trim() || !postContent.trim()) {
      setError('Please provide a publishing agent, title, and post content.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create a temporary post and synchronously simulate routing
      const post = await api.createPost(
        {
          author_agent_id: selectedAgentId,
          title: postTitle.trim(),
          content: postContent.trim(),
        },
        true,
        threshold
      );

      const simResult = await api.simulatePostRouting(post.id, threshold);
      setRoutingResult(simResult);
    } catch (err: any) {
      setError(err.message || 'Failed to simulate routing');
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Sandbox Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Interactive Routing Sandbox</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
              Interviewer Playground
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test any hypothetical announcement, adjust thresholds dynamically, and observe real-time vector matching & LLM reranking decisions.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {preset.companyName}
            </button>
          ))}
        </div>
      </div>

      {/* Input Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Post Payload & Scenario Definition
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Author Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Publishing Company Agent (Author)
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.company_name} — {ag.industry_category}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Announcement Headline
            </label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 5% discount on all food deliveries during Diwali"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Post Content & Commercial Details
            </label>
            <textarea
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              placeholder="Describe commercial parameters, partner triggers, or discount codes..."
            />
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Embedding Dimension: <strong className="text-cyan-400 font-mono">1536-dim</strong>
            </span>

            <button
              onClick={handleExecuteSimulation}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Executing 3-Stage Pipeline...' : 'Run Relevance Simulation'}
            </button>
          </div>
        </div>

        {/* Right: Threshold & Engine Controls */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Stage 3 Gating Threshold
          </h3>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Relevance Threshold:</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{threshold.toFixed(2)}</span>
            </div>

            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.50 (Recall)</span>
              <span className="text-cyan-400 font-bold">0.75 (Default)</span>
              <span>0.95 (Precision)</span>
            </div>
          </div>

          {/* Calibration Summary */}
          <div className="text-xs space-y-2 text-slate-400 leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>At 0.75:</strong> Swiggy routes to PhonePe & HDFC Bank, while Bajaj Auto is reliably dropped.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>At 0.60:</strong> Higher recall allows exploratory e-commerce crossovers.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>At 0.85:</strong> High precision guarantees minimal notification volume and token cost.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Visualizer */}
      {routingResult && (
        <PipelineVisualizer
          routingResult={routingResult}
          postTitle={postTitle}
          authorCompany={selectedAgent?.company_name || 'Author'}
        />
      )}
    </div>
  );
};

