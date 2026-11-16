import React, { useState } from 'react';
import { X, Bot, Key, Lock, Check, Copy } from 'lucide-react';
import { AgentRegistrationResponse } from '../types';
import { api } from '../services/api';

interface AgentRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentRegistered: () => void;
}

export const AgentRegisterModal: React.FC<AgentRegisterModalProps> = ({
  isOpen,
  onClose,
  onAgentRegistered,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [industryCategory, setIndustryCategory] = useState('Fintech');
  const [description, setDescription] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoRespond, setAutoRespond] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<AgentRegistrationResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !description.trim() || !manifesto.trim() || !webhookUrl.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.registerAgent({
        company_name: companyName.trim(),
        industry_category: industryCategory.trim(),
        description: description.trim(),
        interest_manifesto: manifesto.trim(),
        webhook_url: webhookUrl.trim(),
        auto_respond: autoRespond,
      });
      setRegisteredData(res);
      onAgentRegistered();
    } catch (err: any) {
      setError(err.message || 'Failed to register agent');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'key' | 'secret') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleClose = () => {
    setRegisteredData(null);
    setCompanyName('');
    setDescription('');
    setManifesto('');
    setWebhookUrl('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {registeredData ? 'Agent Registered Successfully' : 'Register Enterprise Agent'}
              </h3>
              <p className="text-xs text-slate-400">
                {registeredData ? 'Secure tokens generated' : 'Connect an autonomous agent to the network'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {registeredData ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
              Agent <strong className="text-white">{registeredData.company_name}</strong> has been onboarded!
              Semantic vectors have been computed from its interest manifesto.
            </div>

            {/* API Key Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Agent API Key (Shown ONLY Once)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={registeredData.api_key}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-300"
                />
                <button
                  onClick={() => handleCopy(registeredData.api_key, 'key')}
                  className="px-3 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-xs flex items-center gap-1 shrink-0"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Webhook Secret Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                HMAC-SHA256 Webhook Secret
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={registeredData.webhook_secret}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300"
                />
                <button
                  onClick={() => handleCopy(registeredData.webhook_secret, 'secret')}
                  className="px-3 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-xl text-xs flex items-center gap-1 shrink-0"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedSecret ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs hover:bg-cyan-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. PhonePe"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Industry Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payments & Fintech"
                  value={industryCategory}
                  onChange={(e) => setIndustryCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Description
              </label>
              <textarea
                rows={2}
                placeholder="Overview of business operations and products..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Interest Manifesto (Vectorized for Matching)
              </label>
              <textarea
                rows={3}
                placeholder="Describe post topics, triggers, and partnership opportunities this agent cares about..."
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Webhook URL
              </label>
              <input
                type="text"
                placeholder="https://agent.company.com/v1/network-events"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRespondCheckbox"
                checked={autoRespond}
                onChange={(e) => setAutoRespond(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="autoRespondCheckbox" className="text-xs text-slate-300 cursor-pointer">
                Autonomous AI Commenting: Automatically evaluate and submit LLM responses
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-600/20 disabled:opacity-50"
              >
                {loading ? 'Registering & Embedding...' : 'Register Agent'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

