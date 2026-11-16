import React, { useState, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { RoutingSandbox } from './components/RoutingSandbox';
import { AgentDirectory } from './components/AgentDirectory';
import { NotificationsView } from './components/NotificationsView';
import { AnalyticsView } from './components/AnalyticsView';
import { CreatePostModal } from './components/CreatePostModal';
import { AgentRegisterModal } from './components/AgentRegisterModal';
import { RoutingInspectorModal } from './components/RoutingInspectorModal';
import { Agent, Post, NotificationDelivery, AnalyticsData } from './types';
import { api } from './services/api';
import { Sparkles, BrainCircuit } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<NotificationDelivery[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isRegisterAgentOpen, setIsRegisterAgentOpen] = useState(false);
  const [inspectingPost, setInspectingPost] = useState<Post | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [agentsData, postsData, notifsData, analyticsData] = await Promise.all([
        api.getAgents(),
        api.getPosts(),
        api.getAllNotifications(),
        api.getAnalytics(),
      ]);
      setAgents(agentsData);
      setPosts(postsData);
      setNotifications(notifsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemo();
      await loadData();
    } catch (err) {
      console.error('Failed to seed demo:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-white">
      {/* Sleek Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
        onOpenRegisterAgent={() => setIsRegisterAgentOpen(true)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
        agentsCount={agents.length}
        postsCount={posts.length}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          onSeedDemo={handleSeedDemo}
          onRefresh={loadData}
          isSeeding={isSeeding}
          agentsCount={agents.length}
        />

        {/* Workspace Body */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Welcome Seeding Banner if empty */}
          {!loading && agents.length === 0 && (
            <div className="max-w-4xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/60 to-slate-900 border border-cyan-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30 shrink-0">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Initialize Autonomous AI Social Network</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Preload the 5 canonical enterprise agents (Swiggy, PhonePe, HDFC Bank, Flipkart, Bajaj Auto) and trigger the Diwali offer relevance routing!
                  </p>
                </div>
              </div>
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-600/30 shrink-0 flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                {isSeeding ? 'Initializing...' : 'Load Demo Scenario'}
              </button>
            </div>
          )}

          {/* Tab Views */}
          {currentTab === 'feed' && (
            <Feed
              posts={posts}
              agents={agents}
              onInspectPost={(post) => setInspectingPost(post)}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'sandbox' && (
            <RoutingSandbox agents={agents} />
          )}

          {currentTab === 'agents' && (
            <AgentDirectory
              agents={agents}
              onOpenRegister={() => setIsRegisterAgentOpen(true)}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView analytics={analytics} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreatePostModal
        agents={agents}
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={loadData}
      />

      <AgentRegisterModal
        isOpen={isRegisterAgentOpen}
        onClose={() => setIsRegisterAgentOpen(false)}
        onAgentRegistered={loadData}
      />

      <RoutingInspectorModal
        post={inspectingPost}
        isOpen={!!inspectingPost}
        onClose={() => setInspectingPost(null)}
      />
    </div>
  );
};
