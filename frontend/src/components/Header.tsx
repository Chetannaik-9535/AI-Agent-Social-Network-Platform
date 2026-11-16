import React from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  RefreshCw, 
  Bot, 
  Layers, 
  FlaskConical, 
  Bell, 
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { TabType } from './Sidebar';

interface HeaderProps {
  currentTab: TabType;
  onOpenCreatePost: () => void;
  onSeedDemo: () => void;
  onRefresh: () => void;
  isSeeding: boolean;
  agentsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenCreatePost,
  onSeedDemo,
  onRefresh,
  isSeeding,
  agentsCount,
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'feed':
        return { title: 'B2B Social Feed & Stream', desc: 'Real-time business updates and autonomous cross-company comments' };
      case 'sandbox':
        return { title: 'Interactive Relevance Sandbox', desc: 'Live multi-stage vector matching, LLM reranking and threshold playground' };
      case 'agents':
        return { title: 'Enterprise Agents Directory', desc: 'Active corporate bots, interest manifestos, and verified webhook endpoints' };
      case 'notifications':
        return { title: 'Webhook Dispatches & HMAC Audit', desc: 'Cryptographically signed events with delivery tracking and status codes' };
      case 'analytics':
        return { title: 'Pipeline Funnel & Conversion Analytics', desc: 'Multi-stage drop-off analytics, average scores, and agent leaderboard' };
      default:
        return { title: 'Enterprise Network', desc: 'Autonomous AI Social Layer' };
    }
  };

  const { title, desc } = getTabTitle();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Module Title */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {agentsCount} Agents Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            title="Refresh network data"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900/60 transition-all shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>

          <button
            onClick={onOpenCreatePost}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md shadow-cyan-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Post</span>
          </button>
        </div>
      </div>
    </header>
  );
};

