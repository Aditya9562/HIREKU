"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "../../lib/api";
import { 
  Users, BarChart3, TrendingUp, DollarSign, Upload, 
  ShieldAlert, Users2, ChevronRight, Activity, ArrowLeft,
  Search, Calendar
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
  users_list: Array<{ id: string; email: string; created_at: string; is_admin: boolean; premium_count: number }>;
}

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    const loadMetrics = async () => {
      try {
        const token = await getToken();
        const apiBase = getApiUrl();
        
        // Verify admin status from backend profile
        const profileRes = await fetch(`${apiBase}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!profileRes.ok) {
          router.replace("/dashboard");
          return;
        }
        
        const profileData = await profileRes.json();
        const superAdminEmails = [
          "adityaputra.afendi@gmail.com",
          "adityaafendi02@gmail.com",
          "adityaafendi22@gmail.com"
        ];
        const isSuper = superAdminEmails.includes(user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "");
        
        if (!profileData.is_admin && !isSuper) {
          router.replace("/dashboard");
          return;
        }
        
        setIsAdmin(true);
        setIsSuperAdmin(isSuper);

        const r = await fetch(`${apiBase}/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (r.ok) {
          const data = await r.json();
          setMetrics(data);
        } else {
          router.replace("/dashboard");
          return;
        }
      } catch (err: any) {
        setError("Network connection failed.");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [isLoaded, isSignedIn, getToken, router, user]);

  const handleResetLimit = async (userId: string) => {
    if (!window.confirm("Are you sure you want to reset the daily limit for this user?")) return;
    setActionLoading(userId);
    setSuccessMsg("");
    try {
      const token = await getToken();
      const r = await fetch(`${getApiUrl()}/admin/users/${userId}/reset-limit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setSuccessMsg("User scan limit has been successfully reset!");
      } else {
        const err = await r.json();
        alert(err.detail || "Failed to reset limit.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromote = async (userId: string) => {
    if (!window.confirm("Promote this user to Admin?")) return;
    setActionLoading(userId);
    setSuccessMsg("");
    try {
      const token = await getToken();
      const r = await fetch(`${getApiUrl()}/admin/users/${userId}/promote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setSuccessMsg("User promoted to Admin successfully!");
        setMetrics(prev => prev ? {
          ...prev,
          users_list: prev.users_list.map(u => u.id === userId ? { ...u, is_admin: true } : u)
        } : null);
      } else {
        const err = await r.json();
        alert(err.detail || "Failed to promote user.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (userId: string) => {
    if (!window.confirm("Demote this Admin back to regular user?")) return;
    setActionLoading(userId);
    setSuccessMsg("");
    try {
      const token = await getToken();
      const r = await fetch(`${getApiUrl()}/admin/users/${userId}/demote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setSuccessMsg("Admin demoted to regular user successfully.");
        setMetrics(prev => prev ? {
          ...prev,
          users_list: prev.users_list.map(u => u.id === userId ? { ...u, is_admin: false } : u)
        } : null);
      } else {
        const err = await r.json();
        alert(err.detail || "Failed to demote user.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("WARNING: Deleting this user will permanently remove all their CVs, reports, and data. Proceed?")) return;
    setActionLoading(userId);
    setSuccessMsg("");
    try {
      const token = await getToken();
      const r = await fetch(`${getApiUrl()}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setSuccessMsg("User account deleted successfully.");
        setMetrics(prev => prev ? {
          ...prev,
          users_list: prev.users_list.filter(u => u.id !== userId)
        } : null);
      } else {
        const err = await r.json();
        alert(err.detail || "Failed to delete user.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

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
        <button 
          onClick={() => document.getElementById("user-directory")?.scrollIntoView({ behavior: "smooth" })}
          className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-foreground bg-surface border border-border-strong rounded-full transition-all hover:bg-muted"
        >
          Manage Users <ChevronRight className="w-4 h-4 rotate-90" />
        </button>
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

      {/* User Accounts Directory with Search and Administrative Operations */}
      {metrics && (
        <div id="user-directory" className="p-6 rounded-2xl bg-surface border border-border space-y-6 shadow-sm scroll-mt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-display font-medium text-foreground flex items-center gap-2">
                <Users2 className="w-6 h-6 text-accent" />
                User Accounts Directory
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Search, monitor, reset limits, promote, and delete job seeker profiles.</p>
            </div>
            
            {/* Search filter */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by email or Clerk ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-foreground focus:border-accent outline-none transition text-xs font-semibold"
              />
            </div>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium animate-fade-in">
              {successMsg}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
            <table className="w-full text-sm text-left text-foreground/90">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">User Profile</th>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Premium CVs</th>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Registration Date</th>
                  <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.users_list.filter(u => 
                  u.email.toLowerCase().includes(search.toLowerCase()) || 
                  u.id.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-xs font-mono">
                      No users matching criteria.
                    </td>
                  </tr>
                ) : (
                  metrics.users_list.filter(u => 
                    u.email.toLowerCase().includes(search.toLowerCase()) || 
                    u.id.toLowerCase().includes(search.toLowerCase())
                  ).map((u) => {
                    const dateStr = new Date(u.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    const superAdminEmails = [
                      "adityaputra.afendi@gmail.com",
                      "adityaafendi02@gmail.com",
                      "adityaafendi22@gmail.com"
                    ];
                    const targetIsSuper = superAdminEmails.includes(u.email.toLowerCase());
                    const targetIsAdmin = u.is_admin || targetIsSuper;

                    let roleBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground font-mono">
                        USER
                      </span>
                    );
                    if (targetIsSuper) {
                      roleBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20 font-mono">
                          SUPER ADMIN
                        </span>
                      );
                    } else if (u.is_admin) {
                      roleBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 font-mono">
                          ADMIN
                        </span>
                      );
                    }

                    return (
                      <tr key={u.id} className="hover:bg-muted/40 transition">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-foreground">{u.email}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{u.id}</div>
                        </td>
                        <td className="px-6 py-3.5">{roleBadge}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            u.premium_count > 0 
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                              : "bg-muted/40 text-muted-foreground border-transparent"
                          }`}>
                            👑 {u.premium_count} CV
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {dateStr}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Reset limit button (visible for regular users/admins, not super admin) */}
                            {!targetIsSuper && (
                              <button
                                onClick={() => handleResetLimit(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 border border-teal-500/25 rounded-md transition disabled:opacity-50"
                              >
                                Reset Limit
                              </button>
                            )}

                            {/* Promote/demote button (visible ONLY to Super Admin) */}
                            {isSuperAdmin && !targetIsSuper && (
                              u.is_admin ? (
                                <button
                                  onClick={() => handleDemote(u.id)}
                                  disabled={actionLoading === u.id}
                                  className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/25 rounded-md transition disabled:opacity-50"
                                >
                                  Demote
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePromote(u.id)}
                                  disabled={actionLoading === u.id}
                                  className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/25 rounded-md transition disabled:opacity-50"
                                >
                                  Promote
                                </button>
                              )
                            )}

                            {/* Delete button */}
                            {!targetIsSuper && (!targetIsAdmin || isSuperAdmin) && (
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/25 rounded-md transition disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
