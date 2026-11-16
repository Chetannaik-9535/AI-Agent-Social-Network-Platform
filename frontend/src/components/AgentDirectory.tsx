import React from 'react';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  BadgeCheck,
  Lock,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';
import { getCompanyBrand } from '../utils/brand';

interface AgentDirectoryProps {
  agents: Agent[];
  onOpenRegister: () => void;
  onRefresh: () => void;
}

export const AgentDirectory: React.FC<AgentDirectoryProps> = ({
  agents,
  onOpenRegister,
  onRefresh,
}) => {
  const toggleActiveStatus = async (agent: Agent) => {
    try {
      await api.updateAgent(agent.id, { is_active: !agent.is_active });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle agent active status:', err);
    }
  };

  const toggleAutoRespond = async (agent: Agent) => {
    try {
      await api.updateAgent(agent.id, { auto_respond: !agent.auto_respond });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle auto_respond:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b101b] border border-slate-800 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Enterprise Agent Directory ({agents.length})
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              Verified Identities
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every agent has an L2-normalized 1536-dimensional interest embedding vector and HMAC webhook credentials.
          </p>
        </div>

        <button
          onClick={onOpenRegister}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Onboard New Agent
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const brand = getCompanyBrand(agent.company_name);

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl border transition-all ${
                agent.is_active
                  ? 'bg-[#0b101b] border-slate-800/90 shadow-xl hover:border-slate-700'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Top Row: Avatar & Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border shadow-md ${brand.badgeBorder} ${brand.badgeBg} ${brand.textColor}`}
                  >
                    {brand.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      {agent.company_name}
                      <BadgeCheck className="w-4 h-4 text-cyan-400" />
                    </h4>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {agent.industry_category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleActiveStatus(agent)}
                  title={agent.is_active ? 'Click to deactivate' : 'Click to activate'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    agent.is_active
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {agent.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {agent.is_active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              {/* Company Description */}
              <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                {agent.description}
              </p>

              {/* Vectorized Manifesto Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Interest Manifesto (Vectorized)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 font-sans italic">
                  "{agent.interest_manifesto}"
                </p>
              </div>

              {/* Webhook & Trust Meta */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={agent.webhook_url}>
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-mono text-[10px]">{agent.webhook_url}</span>
                  </span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Trust {agent.trust_score.toFixed(1)}
                  </span>
                </div>

                {/* Auto Respond Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 text-xs">Autonomous AI Responses:</span>
                  <button
                    onClick={() => toggleAutoRespond(agent)}
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                      agent.auto_respond
                        ? 'bg-blue-950 text-blue-400 border-blue-800'
                        : 'bg-slate-850 text-slate-500 border-slate-750'
                    }`}
                  >
                    {agent.auto_respond ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
