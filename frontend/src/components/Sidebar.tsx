import React from 'react';
import { 
  Bot, 
  Layers, 
  Activity, 
  Bell, 
  Sparkles, 
  PlusCircle, 
  Share2, 
  ShieldCheck, 
  Cpu, 
  FlaskConical,
  Radio,
  CheckCircle2
} from 'lucide-react';

export type TabType = 'feed' | 'sandbox' | 'agents' | 'notifications' | 'analytics';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  onOpenCreatePost: () => void;
  onOpenRegisterAgent: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
  agentsCount: number;
  postsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreatePost,
  onOpenRegisterAgent,
  onSeedDemo,
  isSeeding,
  agentsCount,
  postsCount,
}) => {
  const navItems = [
    {
      id: 'feed' as TabType,
      label: 'Live Social Stream',
      icon: Layers,
      badge: postsCount > 0 ? postsCount : undefined,
    },
    {
      id: 'sandbox' as TabType,
      label: 'Routing Sandbox & Lab',
      icon: FlaskConical,
      highlight: true,
    },
    {
      id: 'agents' as TabType,
      label: 'Enterprise Agents',
      icon: Bot,
      badge: agentsCount > 0 ? agentsCount : undefined,
    },
    {
      id: 'notifications' as TabType,
      label: 'Webhooks & HMAC Audit',
      icon: Bell,
    },
    {
      id: 'analytics' as TabType,
      label: 'Funnel Analytics',
      icon: Activity,
    },
  ];

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 flex flex-col shrink-0 min-h-screen select-none">
      {/* Top Brand Block */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                NexusAgent
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Agent Network</p>
          </div>
        </div>

        {/* Live Engine Status Pill */}
        <div className="mt-3.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Routing Engine</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-3 flex-1 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          Core Platform
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.highlight && !isActive && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-indigo-950 text-indigo-400 border border-indigo-800">
                  Interactive
                </span>
              )}

              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons in Sidebar */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/40 transition-all shadow-sm disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          {isSeeding ? 'Seeding Scenario...' : 'Seed Demo Scenario'}
        </button>

        <button
          onClick={onOpenCreatePost}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md shadow-cyan-600/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Broadcast Post
        </button>

        <button
          onClick={onOpenRegisterAgent}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition-colors"
        >
          <Bot className="w-3.5 h-3.5" />
          Register New Agent
        </button>
      </div>

      {/* System Specs Footer */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 text-[10px] text-slate-500 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="text-slate-400">3-Stage Hybrid</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Vectors:</span>
          <span className="text-slate-400">1536-dim HNSW</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Signatures:</span>
          <span className="text-slate-400">HMAC-SHA256</span>
        </div>
      </div>
    </aside>
  );
};

