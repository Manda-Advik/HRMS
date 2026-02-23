import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

import BACKEND from "../api";

const Invitations = () => {
  const { session } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/invitations`, { headers });
      if (!res.ok) throw new Error("Failed to load invitations");
      setInvitations(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${BACKEND}/api/auth/invite`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      setSuccess(`Invite sent to ${email}!`);
      setEmail("");
      fetchInvitations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const pending = invitations.filter((i) => i.status === "pending");
  const accepted = invitations.filter((i) => i.status === "accepted");

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Invitations
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Invite people to your org — they'll receive a confirmation email.
        </p>
      </div>

      {/* Invite Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Send an Invite
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <div className="relative flex-1">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]"
              style={{ fontFamily: "Material Symbols Outlined" }}
            >
              mail
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontFamily: "Material Symbols Outlined" }}
            >
              {sending ? "hourglass_empty" : "send"}
            </span>
            {sending ? "Sending..." : "Send Invite"}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            ✓ {success}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
                Pending
              </h2>
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {pending.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pending.length === 0 ? (
                <p className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No pending invites
                </p>
              ) : (
                pending.map((inv) => (
                  <div
                    key={inv.id}
                    className="px-6 py-4 flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm shrink-0">
                      {inv.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {inv.email}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Invited {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      Pending
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Accepted */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
                Accepted
              </h2>
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                {accepted.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {accepted.length === 0 ? (
                <p className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No accepted invites yet
                </p>
              ) : (
                accepted.map((inv) => (
                  <div
                    key={inv.id}
                    className="px-6 py-4 flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                      {inv.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {inv.email}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Joined {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      ✓ Joined
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invitations;
