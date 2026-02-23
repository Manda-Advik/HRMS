import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import BACKEND from "../api";

const AuthContext = createContext({});

const clearStaleTokens = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("sb-"))
    .forEach((key) => localStorage.removeItem(key));
};

const fetchProfile = async (accessToken) => {
  try {
    const res = await fetch(`${BACKEND}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.profile || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const completing = useRef(false);

  // After an invite link is clicked, complete onboarding if no profile exists
  const maybeCompleteInvite = async (accessToken, userObj) => {
    if (completing.current) return;
    completing.current = true;
    try {
      const res = await fetch(`${BACKEND}/api/auth/complete-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: userObj?.user_metadata?.name || "" }),
      });
      if (res.ok) {
        // Re-fetch profile now that it exists
        const profile = await fetchProfile(accessToken);
        setUserProfile(profile);
      }
    } catch (e) {
      console.warn("completeInvite error:", e);
    } finally {
      completing.current = false;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.warn("Session error, clearing tokens:", error.message);
        clearStaleTokens();
        setSession(null);
        setUser(null);
        setUserProfile(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          const profile = await fetchProfile(session.access_token);
          setUserProfile(profile);
          // Only auto-complete an invite if user arrived via the invite link
          if (
            !profile &&
            session.user &&
            window.location.pathname === "/accept-invite"
          ) {
            await maybeCompleteInvite(session.access_token, session.user);
          }
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        clearStaleTokens();
        setSession(null);
        setUser(null);
        setUserProfile(null);
      } else if (event === "SIGNED_IN" && session) {
        setSession(session);
        setUser(session.user);
        const profile = await fetchProfile(session.access_token);
        setUserProfile(profile);
        // Only trigger invite completion on the dedicated accept-invite route
        if (
          !profile &&
          session.user &&
          window.location.pathname === "/accept-invite"
        ) {
          await maybeCompleteInvite(session.access_token, session.user);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.access_token) {
      const profile = await fetchProfile(session.access_token);
      setUserProfile(profile);
    }
  };

  const role = userProfile?.role || null;
  const employeeId = userProfile?.employee_id || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        role,
        employeeId,
        loading,
        refreshProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
