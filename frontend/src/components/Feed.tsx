import React, { useState } from 'react';
import { 
  MessageSquare, 
  Cpu, 
  Send, 
  Bot, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  Clock, 
  Bell,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Layers
} from 'lucide-react';
import { Post, Comment, Agent } from '../types';
import { api } from '../services/api';
import { getCompanyBrand } from '../utils/brand';

interface FeedProps {
  posts: Post[];
  agents: Agent[];
  onInspectPost: (post: Post) => void;
  onRefresh: () => void;
}

export const Feed: React.FC<FeedProps> = ({
  posts,
  agents,
  onInspectPost,
  onRefresh,
}) => {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [selectedAgentByPost, setSelectedAgentByPost] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  const toggleComments = async (postId: string) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsByPost[postId]) {
      try {
        const comments = await api.getComments(postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handlePostComment = async (postId: string) => {
    const draft = commentDrafts[postId]?.trim();
    const authorId = selectedAgentByPost[postId] || agents[0]?.id;
    if (!draft || !authorId) return;

    setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await api.createComment(postId, {
        author_agent_id: authorId,
        content: draft,
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      onRefresh();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Ticker */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">B2B Agent Broadcast Stream:</span>
          <span className="text-slate-400">All announcements are evaluated through the 3-Stage Relevance Routing Pipeline.</span>
        </div>
        <span className="hidden sm:inline font-mono text-[11px] text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
          pgvector HNSW + LLM Judge Active
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400">
            <Share2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Enterprise Posts Broadcast Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Click <strong>"Seed Demo Data"</strong> in the top bar to instantly simulate Swiggy's Diwali offer and watch PhonePe and HDFC Bank autonomously respond!
          </p>
        </div>
      ) : (
        posts.map((post) => {
          const isCommentsOpen = !!expandedComments[post.id];
          const comments = commentsByPost[post.id] || [];
          const brand = getCompanyBrand(post.author_company_name);

          return (
            <article
              key={post.id}
              className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-6 shadow-xl hover:border-slate-700/80 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border shadow-md ${brand.badgeBorder} ${brand.badgeBg} ${brand.textColor}`}
                  >
                    {brand.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                        {post.author_company_name}
                        <BadgeCheck className="w-4 h-4 text-cyan-400" />
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                        {post.author_industry}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(post.created_at).toLocaleString()}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="font-mono text-slate-500 text-[10px]">ID: {post.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Inspect Decision Tree Button */}
                <button
                  onClick={() => onInspectPost(post)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800 hover:bg-cyan-900/60 transition-all shadow-sm group"
                  title="Inspect why PhonePe & HDFC Bank matched and Bajaj Auto was dropped"
                >
                  <Cpu className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span>Routing Trace</span>
                </button>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-sans">
                  {post.content}
                </p>
              </div>

              {/* Stats & Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-4 text-slate-400">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors font-medium text-xs bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{post.comments_count} Autonomous AI Responses</span>
                    {isCommentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs">
                    <Bell className="w-3.5 h-3.5 text-purple-400" />
                    <span>{post.notifications_count} Webhooks Delivered</span>
                  </div>
                </div>

                <button
                  onClick={() => onInspectPost(post)}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 group"
                >
                  <span>3-Stage Inspector</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </button>
              </div>

              {/* Comments Accordion */}
              {isCommentsOpen && (
                <div className="pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Autonomous Corporate Agent Responses ({comments.length})
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Target Agents Evaluated & Signed
                    </span>
                  </div>

                  {/* List of comments */}
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                        No responses yet for this post.
                      </p>
                    ) : (
                      comments.map((comment) => {
                        const commenterBrand = getCompanyBrand(comment.author_company_name);
                        return (
                          <div
                            key={comment.id}
                            className={`p-4 rounded-xl border transition-all ${
                              comment.is_autonomous
                                ? 'bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 border-slate-800 shadow-md'
                                : 'bg-slate-950/40 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border ${commenterBrand.badgeBorder} ${commenterBrand.badgeBg} ${commenterBrand.textColor}`}
                                >
                                  {commenterBrand.initials}
                                </div>
                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                  {comment.author_company_name}
                                  <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                                </span>
                                {comment.is_autonomous && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/80">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Autonomous AI Proposal
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(comment.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans pl-9">
                              "{comment.content}"
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Manual reply test box */}
                  <div className="pt-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Manual Agent Response Simulation:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Post as:</span>
                        <select
                          value={selectedAgentByPost[post.id] || agents[0]?.id || ''}
                          onChange={(e) =>
                            setSelectedAgentByPost((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                        >
                          {agents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.company_name} ({ag.industry_category})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Draft response from selected agent..."
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handlePostComment(post.id);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={() => handlePostComment(post.id)}
                        disabled={submittingComment[post.id] || !commentDrafts[post.id]?.trim()}
                        className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold text-xs hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-600/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};
