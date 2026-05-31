"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { User, ShieldAlert, Trash2, Calendar, ShieldCheck } from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function UserProfilePage() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const triggerDeleteAccount = async () => {
    setLoading(true);
    setError("");
    setStatusMessage("");
    
    try {
      const token = await getToken();
      const apiBase = getApiUrl();
      
      const r = await fetch(`${apiBase}/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (r.ok) {
        setStatusMessage("Purging all user data... Signing out.");
        // Sign out from Clerk
        setTimeout(async () => {
          await signOut();
          router.push("/");
        }, 1500);
      } else {
        const errData = await r.json();
        setError(errData.detail || "Account deletion failed.");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Network connection issue.");
      setLoading(false);
    }
  };

  const createdDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }) : "Recent Join";

  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 text-left max-w-4xl">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit flex items-center gap-2">
          <User className="w-8 h-8 text-primary-500" /> User Profile Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account details and configure privacy preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Card: Info summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white font-outfit">Account Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Email Address</span>
                <span className="block text-white font-semibold">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Account ID</span>
                <span className="block text-white font-mono text-xs truncate">{user?.id}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date Joined
                </span>
                <span className="block text-white font-semibold">{createdDate}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-400" /> Admin Access
                </span>
                <span className="block text-white font-semibold">
                  {["adityaputra.afendi@gmail.com", "adityaafendi02@gmail.com", "adityaafendi22@gmail.com"].includes(
                    user?.primaryEmailAddress?.emailAddress?.toLowerCase() || ""
                  ) ? "Granted" : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Security / Deletion Actions */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass border border-red-500/10 bg-red-950/5 space-y-4">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-1.5 font-outfit">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Privacy Center
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We operate a privacy-first system. Resumes auto-expire after 30 days. You can purge all your database records instantly below.
            </p>
            
            {statusMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs">
                {statusMessage}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {!confirmDelete ? (
              <button 
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl border border-red-500/20 transition flex items-center gap-1.5 justify-center text-xs"
              >
                <Trash2 className="w-4 h-4" /> Delete My Account
              </button>
            ) : (
              <div className="space-y-2.5 pt-2">
                <p className="text-xs text-red-400 font-semibold">Are you absolutely sure? This action is irreversible.</p>
                <div className="flex gap-2">
                  <button 
                    disabled={loading}
                    onClick={triggerDeleteAccount}
                    className="flex-grow py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition"
                  >
                    {loading ? "Deleting..." : "Yes, Purge All"}
                  </button>
                  <button 
                    disabled={loading}
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
