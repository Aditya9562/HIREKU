"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users2, ShieldAlert, Calendar, Search } from "lucide-react";
import { getApiUrl } from "../../../lib/api";

interface UserDetail {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setError("Unauthorized access. Administrative permissions required.");
      setLoading(false);
      return;
    }

    const loadUsers = async () => {
      try {
        const token = await getToken();
        const apiBase = getApiUrl();
        
        // Verify admin status from backend profile
        const profileRes = await fetch(`${apiBase}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!profileRes.ok) {
          setError("Failed to verify administrative status.");
          setLoading(false);
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
          setError("Unauthorized access. Administrative permissions required.");
          setLoading(false);
          return;
        }
        
        setIsAdmin(true);
        setIsSuperAdmin(isSuper);

        const r = await fetch(`${apiBase}/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (r.ok) {
          const data = await r.json();
          setUsersList(data.users_list);
        } else {
          setError("Failed to load user listing.");
        }
      } catch (err: any) {
        setError("Network connection issue.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isLoaded, isSignedIn, getToken]);

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
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_admin: true } : u));
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
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_admin: false } : u));
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
        setUsersList(prev => prev.filter(u => u.id !== userId));
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
        <p className="text-muted-foreground text-sm leading-relaxed">{error || "You do not have access rights to this page."}</p>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-2.5 bg-foreground hover:bg-foreground/90 text-primary-foreground rounded-full text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 text-left">
      
      {/* Header */}
      <div>
        <Link 
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-semibold mb-2 font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> BACK TO ADMIN OVERVIEW
        </Link>
        <h1 className="text-3xl font-display font-medium text-foreground tracking-tight flex items-center gap-2">
          <Users2 className="w-7 h-7 text-accent" /> User Accounts Directory
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-sans">Search, monitor and audit registered job seeker profiles.</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by email or Clerk ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground focus:border-accent outline-none transition text-sm font-medium"
        />
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Users Table */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
          <table className="w-full text-sm text-left text-foreground/90">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">User Profile</th>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Registration Date</th>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-xs font-mono">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const dateStr = new Date(u.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
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
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{u.email}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{u.id}</div>
                      </td>
                      <td className="px-6 py-4">{roleBadge}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {dateStr}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
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

                          {/* Delete button:
                              - Super Admin can delete anyone except other Super Admins.
                              - Admin can delete regular Users only.
                          */}
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

    </div>
  );
}
