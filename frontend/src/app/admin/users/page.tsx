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
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [usersList, setUsersList] = useState<UserDetail[]>([]);
  const [search, setSearch] = useState("");
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

    async function loadUsers() {
      try {
        const token = await getToken();
        const apiBase = getApiUrl();
        
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
    }

    if (isLoaded && isAdmin) {
      loadUsers();
    }
  }, [isLoaded, isSignedIn, isAdmin, getToken]);

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

      {/* Users Table */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
          <table className="w-full text-sm text-left text-foreground/90">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">User Email</th>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Clerk User ID</th>
                <th scope="col" className="px-6 py-3 font-semibold font-mono tracking-wider">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground text-xs font-mono">
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
                  return (
                    <tr key={u.id} className="hover:bg-muted/40 transition">
                      <td className="px-6 py-4 font-semibold text-foreground">{u.email}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{u.id}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {dateStr}
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
