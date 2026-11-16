import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Key, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Send,
  Sparkles,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { NotificationDelivery } from '../types';
import { getCompanyBrand } from '../utils/brand';

interface NotificationsViewProps {
  notifications: NotificationDelivery[];
  onRefresh: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onRefresh,
}) => {
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePayload = (id: string) => {
    setExpandedPayloads((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySignature = (sig: string, id: string) => {
    navigator.clipboard.writeText(sig);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = notifications.filter((n) => {
    if (statusFilter === 'ALL') return true;
    return n.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0b101b] border border-slate-800 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Webhook Delivery Console & HMAC Security Audit
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every relevant notification is signed with HMAC-SHA256 and pushed asynchronously with exponential backoff.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'ENGAGED', 'DELIVERED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Delivery Status</th>
                <th className="px-5 py-3.5">Target Agent</th>
                <th className="px-5 py-3.5">Post Announcement</th>
                <th className="px-5 py-3.5">HTTP Code</th>
                <th className="px-5 py-3.5">Attempts</th>
                <th className="px-5 py-3.5">HMAC-SHA256 Signature</th>
                <th className="px-5 py-3.5">Dispatched At</th>
                <th className="px-5 py-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-500 font-sans">
                    No webhook deliveries match current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isExpanded = !!expandedPayloads[item.id];
                  const isEngaged = item.status === 'ENGAGED';
                  const isDelivered = item.status === 'DELIVERED';
                  const isFailed = item.status === 'FAILED';
                  const brand = getCompanyBrand(item.target_company_name);

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border shadow-sm ${
                              isEngaged
                                ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
                                : isDelivered
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border-rose-800'
                            }`}
                          >
                            {isEngaged || isDelivered ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] border ${brand.badgeBorder} ${brand.badgeBg} ${brand.textColor}`}
                            >
                              {brand.initials}
                            </span>
                            <span>{item.target_company_name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-300 max-w-xs truncate font-medium" title={item.post_title}>
                          {item.post_title}
                        </td>

                        <td className="px-5 py-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              item.http_status === 200
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {item.http_status || '-'}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-mono text-slate-400">{item.attempts}</td>

                        <td className="px-5 py-4 font-mono text-[10px] text-cyan-300">
                          <div className="flex items-center gap-1.5">
                            <span title={item.signature}>{item.signature.slice(0, 14)}...</span>
                            <button
                              onClick={() => handleCopySignature(item.signature, item.id)}
                              className="text-slate-500 hover:text-white"
                              title="Copy full HMAC signature"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => togglePayload(item.id)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Payload Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#070b12] border-y border-slate-800">
                          <td colSpan={8} className="p-5">
                            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-cyan-300 overflow-x-auto shadow-inner">
                              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400 text-xs font-sans">
                                <span className="font-semibold text-white flex items-center gap-2">
                                  <Code className="w-4 h-4 text-cyan-400" />
                                  Cryptographically Signed Webhook Event Payload
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  X-Agent-Signature: {item.signature}
                                </span>
                              </div>
                              <pre className="text-emerald-300">{JSON.stringify(item.payload, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
