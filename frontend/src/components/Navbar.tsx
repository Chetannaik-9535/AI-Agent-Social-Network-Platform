import React from 'react';
import { 
  Bot, 
  Layers, 
  Activity, 
  Bell, 
  Sparkles, 
  PlusCircle, 
  RefreshCw,
  Share2
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'feed' | 'agents' | 'notifications' | 'analytics';
  setCurrentTab: (tab: 'feed' | 'agents' | 'notifications' | 'analytics') => void;
  onOpenCreatePost: () => void;
  onOpenRegisterAgent: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreatePost,
  onOpenRegisterAgent,
  onSeedDemo,
  isSeeding,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  NexusAgent
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  B2B AI Network
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Enterprise Multi-Agent Social Layer</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setCurrentTab('feed')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'feed'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Social Feed
            </button>

            <button
              onClick={() => setCurrentTab('agents')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'agents'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4" />
              Agents Directory
            </button>

            <button
              onClick={() => setCurrentTab('notifications')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'notifications'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              Webhooks & Routing
            </button>

            <button
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'analytics'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              Analytics & Funnel
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              title="Preload Swiggy, PhonePe, HDFC, Flipkart, Bajaj Auto demo scenario"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/50 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
            </button>

            <button
              onClick={onOpenCreatePost}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-sm shadow-cyan-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Post
            </button>

            <button
              onClick={onOpenRegisterAgent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              Register Agent
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

