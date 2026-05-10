"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, Zap, ShieldCheck, Key, Copy, CheckCircle2,
  Plus, Trash2, Eye, EyeOff, Activity, Globe, RefreshCw, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ApiKeyRecord } from '@/types';

interface ApiKeyRecordExt extends ApiKeyRecord {
  monthlyLimit: number;
}

interface RealDashboardStats {
  total_keys: number;
  total_tryons: number;
  total_users: number;
  usage_this_month: number;
}

interface AnalyticsData {
  successRate: number;
  avgResponseTime: number;
  topProducts: { id: string, name: string, count: number }[];
  dailyVolume: { date: string, count: number }[];
}

function maskKey(key: string): string {
  if (!key) return '';
  return key.slice(0, 12) + '•'.repeat(12) + key.slice(-4);
}

function StatCard({ icon: Icon, label, value, trend, isLoading }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; trend?: string, isLoading?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#bef264]/30 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#bef264]/5 blur-3xl -mr-12 -mt-12 group-hover:bg-[#bef264]/10 transition-colors" />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#bef264]/10 transition-colors border border-white/10 group-hover:border-[#bef264]/20">
          <Icon className="w-6 h-6 text-white/70 group-hover:text-[#bef264] transition-colors" />
        </div>
        {trend && !isLoading && (
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#bef264] bg-[#bef264]/10 px-2.5 py-1 rounded-lg border border-[#bef264]/20">
            {trend}
          </span>
        )}
      </div>
      <div className="relative z-10">
        {isLoading ? (
          <div className="h-9 w-24 bg-white/10 rounded-md animate-pulse mb-1"></div>
        ) : (
          <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
        )}
        <p className="text-white/40 text-sm font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [keys, setKeys] = useState<ApiKeyRecordExt[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'keys' | 'usage'>('overview');

  const [stats, setStats] = useState<RealDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [keysRes, statsRes, analyticsRes] = await Promise.all([
        fetch('/api/keys/list'),
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/analytics')
      ]);

      if (!keysRes.ok || !statsRes.ok || !analyticsRes.ok) throw new Error("Failed to fetch dashboard data");

      const keysData = await keysRes.json();
      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();

      if (Array.isArray(keysData)) {
        setKeys(keysData.map((row: Record<string, string | number | undefined>) => ({
          id: String(row.id),
          marketplaceName: String(row.marketplace_name),
          key: String(row.key),
          createdAt: new Date(String(row.created_at)).toLocaleDateString(),
          callCount: Number(row.requests_count) || 0,
          monthlyLimit: Number(row.monthly_limit) || 10000,
          status: String(row.status) as 'active' | 'revoked',
        })));
      }

      setStats(statsData as RealDashboardStats);
      setAnalytics(analyticsData as AnalyticsData);
    } catch (e: unknown) {
      console.error("Dashboard fetch error:", e);
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateKey = async () => {
    const marketplace = prompt("Enter Marketplace Name");
    if (!marketplace) return;
    
    const limit = prompt("Monthly Limit", "10000");
    const monthly_limit = limit ? parseInt(limit) : 10000;

    const res = await fetch('/api/keys/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketplace_name: marketplace, monthly_limit })
    });
    
    if (res.ok) {
      fetchDashboardData();
    } else {
      alert("Failed to generate key");
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyKey = async (id: string, key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeKey = async (id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'revoked' } : k));
    try {
      await fetch('/api/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: id })
      });
    } catch (e) {
      console.error(e);
      fetchDashboardData();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-10 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#bef264]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 1, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3"
          >
            VEXA <span className="text-[#bef264]">HUB</span>
          </motion.h1>
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 text-white/40"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <Activity className="w-3.5 h-3.5 text-[#bef264]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#bef264]">System Live</span>
            </div>
            <p className="text-sm font-medium">API platform management · Live Production Data</p>
          </motion.div>
        </div>
        <motion.button
          onClick={fetchDashboardData}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#bef264] text-black font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(190,242,100,0.4)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Synchronize Data'}
        </motion.button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit backdrop-blur-3xl overflow-x-auto">
        {(['overview', 'analytics', 'keys', 'usage'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300
              ${activeTab === tab ? 'text-black' : 'text-white/40 hover:text-white/70'}
            `}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#bef264] rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard isLoading={isLoading} icon={Users} label="Total Users" value={stats?.total_users?.toLocaleString() || 0} />
              <StatCard isLoading={isLoading} icon={Globe} label="Total API Keys" value={stats?.total_keys?.toLocaleString() || 0} />
              <StatCard isLoading={isLoading} icon={Zap} label="Total Try-Ons" value={stats?.total_tryons?.toLocaleString() || 0} />
              <StatCard isLoading={isLoading} icon={Activity} label="Usage This Month" value={stats?.usage_this_month?.toLocaleString() || 0} />
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#bef264]" />
                Infrastructure Health
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Supabase Database', status: 'Operational', color: '#bef264' },
                  { label: 'VEXA Try-On Engine', status: 'Operational', color: '#bef264' },
                  { label: 'Cloudflare R2', status: 'Operational', color: '#bef264' },
                  { label: 'Live Data Pipeline', status: isLoading ? 'Syncing...' : 'Connected', color: isLoading ? '#fbbf24' : '#bef264' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'Operational' || s.status === 'Connected' ? 'animate-pulse' : ''}`} style={{ backgroundColor: s.color }} />
                    <div>
                      <p className="text-white text-sm font-medium">{s.label}</p>
                      <p className="text-white/40 text-xs">{s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <StatCard isLoading={isLoading} icon={CheckCircle} label="Global Success Rate" value={`${analytics?.successRate ?? 100}%`} />
               <StatCard isLoading={isLoading} icon={Clock} label="Avg API Response Time" value={`${analytics?.avgResponseTime ?? 0} ms`} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
                 <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#bef264]" />
                    30-Day Try-On Volume
                 </h2>
                 <div className="h-72 w-full text-xs">
                    {isLoading ? (
                       <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics?.dailyVolume?.slice().reverse() || []}>
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                          <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                          <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="count" stroke="#bef264" strokeWidth={3} dot={{ fill: '#bef264', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                 </div>
               </div>
               
               <div className="glass-panel p-6 rounded-2xl border border-white/10">
                 <h2 className="text-white font-semibold mb-6">Top Products</h2>
                 {isLoading ? (
                   <div className="space-y-3">
                      {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />)}
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {analytics?.topProducts?.length === 0 && (
                        <p className="text-white/40 text-sm">No product data available yet.</p>
                     )}
                     {analytics?.topProducts?.map((prod, i) => (
                        <div key={prod.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-[#bef264]/30 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-[#bef264]/10 text-[#bef264] flex items-center justify-center text-xs font-bold">{i + 1}</div>
                              <span className="text-white text-sm truncate max-w-[120px]">{prod.name}</span>
                           </div>
                           <span className="text-[#bef264] text-xs font-bold">{prod.count} <span className="text-white/30 font-medium">uses</span></span>
                        </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'keys' && (
          <motion.div key="keys" initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Marketplace API Keys</h2>
              <button
                onClick={handleGenerateKey}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#bef264] text-black font-semibold text-sm hover:bg-[#a3e635] transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                New Key
              </button>
            </div>

            <div className="space-y-3">
              {isLoading && keys.length === 0 && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="glass-panel p-5 rounded-2xl h-24 bg-white/5 animate-pulse border border-white/5" />)}
                </div>
              )}
              
              {!isLoading && keys.length === 0 && (
                <div className="text-white/40 text-sm p-8 text-center glass-panel rounded-2xl border border-white/10">
                  No API Keys found in the database. Generate one to allow external integrations!
                </div>
              )}
              
              {keys.map((record) => (
                <motion.div
                  key={record.id}
                  layout
                  className={`glass-panel p-5 rounded-2xl border transition-colors ${
                    record.status === 'revoked' ? 'border-red-500/20 opacity-60' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold">{record.marketplaceName}</p>
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${
                          record.status === 'active' ? 'bg-[#bef264]/20 text-[#bef264]' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-white/50 text-xs font-mono truncate bg-black/40 px-2 py-1 rounded">
                          {revealedKeys.has(record.id) ? record.key : maskKey(record.key)}
                        </code>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-white/40 text-xs font-medium uppercase tracking-wider">
                        <span>Created {record.createdAt}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{record.callCount.toLocaleString()} Calls</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleReveal(record.id)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors border border-white/5 shadow-sm" title={revealedKeys.has(record.id) ? 'Hide key' : 'Reveal key'}>
                        {revealedKeys.has(record.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => copyKey(record.id, record.key)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors border border-white/5 shadow-sm" title="Copy key">
                        {copiedId === record.id ? <CheckCircle2 className="w-4 h-4 text-[#bef264]" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {record.status === 'active' && (
                        <button onClick={() => revokeKey(record.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors border border-white/5 shadow-sm" title="Revoke key">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'usage' && (
          <motion.div key="usage" initial={{ opacity: 1, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 1 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-[#bef264]" /> Quota Tracking
              </h2>
              <div className="space-y-6">
                {isLoading && (
                   <div className="space-y-4">
                     {[1,2].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-lg" />)}
                   </div>
                )}
                {!isLoading && keys.length === 0 && <div className="text-white/40 text-sm">No usage data to display.</div>}
                
                {keys.map((k) => {
                  const limit = k.monthlyLimit;
                  const count = k.callCount;
                  const pct = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;
                  const isNearLimit = pct > 85;

                  return (
                    <div key={k.id} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex justify-between text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{k.marketplaceName}</span>
                          <span className="text-xs text-white/40 font-mono">{maskKey(k.key)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`font-semibold ${isNearLimit ? 'text-rose-400' : 'text-[#bef264]'}`}>{count.toLocaleString()}</span>
                           <span className="text-white/40">/ {limit.toLocaleString()} limit</span>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden border border-white/5 relative">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-[#bef264] to-[#a3e635]'}`} />
                      </div>
                      {isNearLimit && <p className="text-rose-400 text-xs mt-2 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> Approaching monthly limit</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
