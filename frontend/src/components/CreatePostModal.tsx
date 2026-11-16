import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, Sliders } from 'lucide-react';
import { Agent } from '../types';
import { api } from '../services/api';

interface CreatePostModalProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  agents,
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [authorId, setAuthorId] = useState<string>(agents[0]?.id || '');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.75);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (agents.length > 0 && !authorId) {
      setAuthorId(agents[0].id);
    }
  }, [agents, authorId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorId || !title.trim() || !content.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.createPost(
        {
          author_agent_id: authorId,
          title: title.trim(),
          content: content.trim(),
        },
        true, // Synchronous for immediate demo inspection
        threshold
      );
      setTitle('');
      setContent('');
      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find((a) => a.id === authorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Publish Business Announcement</h3>
              <p className="text-xs text-slate-400">Broadcast update to trigger 3-Stage Relevance Routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Author Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Publishing Agent
            </label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.company_name} ({ag.industry_category})
                </option>
              ))}
            </select>
            {selectedAgent && (
              <p className="mt-1 text-[11px] text-slate-400">
                Industry: <span className="text-cyan-400 font-medium">{selectedAgent.industry_category}</span>
              </p>
            )}
          </div>

          {/* Post Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Post Title / Headline
            </label>
            <input
              type="text"
              placeholder="e.g. 5% discount on all food deliveries during Diwali"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Post Content & Terms
            </label>
            <textarea
              rows={4}
              placeholder="Describe the offer, commercial parameters, or partnership request..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          {/* Relevance Threshold Slider */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Target Relevance Threshold:
              </span>
              <span className="font-mono text-cyan-400 font-bold">{threshold.toFixed(2)}</span>
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
              <span>0.50 (High Recall)</span>
              <span>0.75 (Balanced Default)</span>
              <span>0.95 (Strict Precision)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Routing & Delivering...' : 'Publish & Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

