"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "../../lib/api";
import { 
  Users, BarChart3, TrendingUp, DollarSign, Upload, 
  ShieldAlert, Users2, ChevronRight, Activity, ArrowLeft 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell 
} from "recharts";

interface MetricData {
  total_users: number;
  total_uploads: number;
  total_analyses: number;
  premium_conversion_rate: number;
  total_revenue: number;
  most_targeted_companies: Array<{ name: string; value: number }>;
  most_targeted_positions: Array<{ name: string; value: number }>;
  most_common_missing_skills: Array<{ name: string; value: number }>;
  daily_active_users: Array<{ date: string; users: number }>;
  users_list: Array<{ id: string; email: string; created_at: string }>;
}

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminEmails = [
    "adityaputra.afendi@gmail.com",
    "adityaafendi02@gmail.com",
    "adityaafendi22@gmail.com"
  ];
  const isAdmin = isLoaded && isSignedIn && adminEmails.includes(user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "");

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      setError("Unauthorized access. Administrative permissions required.");
      setLoading(false);
      return;
    }

    async function loadMetrics() {
      try {
        const token = await getToken();
        const apiBase = getApiUrl();
        
        const r = await fetch(`${apiBase}/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (r.ok) {
          const data = await r.json();
          setMetrics(data);
        } else {
          setError("Failed to load dashboard metrics. Ensure you are authorized.");
        }
      } catch (err: any) {
        setError("Network connection failed.");
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && isAdmin) {
      loadMetrics();
    }
  }, [isLoaded, isSignedIn, isAdmin, getToken]);

  if (loading) {
    return (
      <div className="section-container py-20 text-center space-y-8 animate-pulse">
        <div className="h-12 bg-surface rounded-xl w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(n => <div key={n} className="h-28 bg-surface rounded-xl border border-border"></div>)}
        </div>
        <div className="h-96 bg-surface rounded-2xl border border-border"></div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-display font-medium text-foreground">Access Denied</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{error || "You do not have access rights to the admin panel."}</p>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-2.5 bg-foreground hover:bg-foreground/90 text-primary-foreground rounded-full text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Curated theme color list matching cream and sienna
  const chartColors = ["#eb5e28", "#252422", "#403d39", "#ccc5b9", "#f4f1de", "#e07a5f"];

  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-semibold mb-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO DASHBOARD
          </button>
          
          <h1 className="text-3xl font-display font-medium text-foreground tracking-tight flex items-center gap-2">
            <Users2 className="w-7 h-7 text-accent" /> Admin Analytics Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-sans">Real-time SaaS conversion, revenue, and usage logs.</p>
        </div>
        <Link 
          href="/admin/users"
          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-foreground bg-surface border border-border-strong rounded-full transition-all hover:bg-muted"
        >
          Manage Users <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-sm">
            <span className="label-eyebrow flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-accent" /> Total Users
            </span>
            <p className="text-3xl font-display font-semibold text-foreground">{metrics.total_users}</p>
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-sm">
            <span className="label-eyebrow flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-accent" /> Total Uploads
            </span>
            <p className="text-3xl font-display font-semibold text-foreground">{metrics.total_uploads}</p>
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-2 shadow-sm">
            <span className="label-eyebrow flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-accent" /> Conversion Rate
            </span>
            <p className="text-3xl font-display font-semibold text-foreground">{metrics.premium_conversion_rate}%</p>
          </div>
          <div className="p-5 rounded-2xl bg-accent-soft/30 border border-accent/25 space-y-2 shadow-sm">
            <span className="label-eyebrow flex items-center gap-1 text-accent">
              <DollarSign className="w-3.5 h-3.5 text-accent" /> Total Sales
            </span>
            <p className="text-3xl font-display font-semibold text-accent">
              Rp {metrics.total_revenue.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart: Daily Active Users */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
            <h3 className="text-lg font-display font-medium text-foreground flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-accent" />
              Daily Active Audits (Past 7 Days)
            </h3>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.daily_active_users} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dauGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eb5e28" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#eb5e28" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#8b8682" fontSize={10} className="font-mono" />
                  <YAxis stroke="#8b8682" fontSize={10} allowDecimals={false} className="font-mono" />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e6dfd5" }} labelStyle={{ color: "#252422" }} />
                  <Area type="monotone" dataKey="users" stroke="#eb5e28" strokeWidth={2} fillOpacity={1} fill="url(#dauGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Missing Skills Chart */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
            <h3 className="text-lg font-display font-medium text-foreground flex items-center gap-1.5">
              <BarChart3 className="w-5 h-5 text-accent" />
              Common Missing Skills
            </h3>
            
            <div className="space-y-4 pt-2">
              {metrics.most_common_missing_skills.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono">No skills data processed yet.</p>
              ) : (
                metrics.most_common_missing_skills.map((skill, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground/90 font-sans">{skill.name}</span>
                      <span className="text-muted-foreground font-mono">{skill.value} counts</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div className="bg-accent h-full rounded-full animate-pulse-glow" style={{ width: `${(skill.value / Math.max(1, metrics.total_analyses)) * 100}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Target Companies and Positions Split charts */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Targeted Companies */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
            <h3 className="text-lg font-display font-medium text-foreground">Top Targeted Companies</h3>
            
            <div className="w-full h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.most_targeted_companies} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <XAxis type="number" stroke="#8b8682" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#252422" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e6dfd5" }} />
                  <Bar dataKey="value" fill="#eb5e28" radius={[0, 4, 4, 0]} barSize={12}>
                    {metrics.most_targeted_companies.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Targeted Positions */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
            <h3 className="text-lg font-display font-medium text-foreground">Top Targeted Positions</h3>
            
            <div className="w-full h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.most_targeted_positions} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <XAxis type="number" stroke="#8b8682" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#252422" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e6dfd5" }} />
                  <Bar dataKey="value" fill="#eb5e28" radius={[0, 4, 4, 0]} barSize={12}>
                    {metrics.most_targeted_positions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[(index + 1) % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Recent Signed Up Users List */}
      {metrics && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
          <h3 className="text-lg font-display font-medium text-foreground">Recent User Sign Ups</h3>
          
          <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
            <table className="w-full text-sm text-left text-foreground/90">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">User Email</th>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Clerk User ID</th>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.users_list.map((u) => {
                  const dateStr = new Date(u.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  return (
                    <tr key={u.id} className="hover:bg-muted/40 transition">
                      <td className="px-6 py-3.5 font-semibold text-foreground">{u.email}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{u.id}</td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono">{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
