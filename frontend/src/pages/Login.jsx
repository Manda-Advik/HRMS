import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3ModalProvider,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import { BrowserProvider } from "ethers";

import BACKEND from "../api";

// 1. Get projectId from WalletConnect Cloud
const projectId =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ||
  "eb9f844d299814ecd83cba8b91848026";

// 2. Set provider metadata
const metadata = {
  name: "AI-HRMS",
  description: "AI-HRMS Web3 Login",
  url: "http://localhost:5173",
  icons: ["https://avatars.mywebsite.com/"],
};

// 3. Create a config using default config
const config = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  enableWalletConnect: true, // Explicitly enable WalletConnect QR
});

// 4. Create Web3Modal
createWeb3Modal({
  ethersConfig: config,
  chains: [
    {
      chainId: 1,
      name: "Ethereum",
      currency: "ETH",
      explorerUrl: "https://etherscan.io",
      rpcUrl: "https://cloudflare-eth.com",
    },
  ],
  projectId,
});
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSigningWeb3, setIsSigningWeb3] = useState(false);
  // Web3 onboarding — holds the session + role when a new wallet needs profile setup
  const [web3Onboard, setWeb3Onboard] = useState(null); // { session, role }
  const [onboardName, setOnboardName] = useState("");
  const [onboardOrg, setOnboardOrg] = useState("");
  // Guard: prevents personal_sign being called twice when multiple deps change at once
  const signingInProgress = useRef(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { open } = useWeb3Modal();
  const { walletProvider } = useWeb3ModalProvider();
  const { address, isConnected } = useWeb3ModalAccount();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Fetch role to redirect correctly
        let role = null;
        try {
          const res = await fetch(`${BACKEND}/api/auth/me`, {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          });
          if (res.ok) {
            const json = await res.json();
            role = json.profile?.role || null;
          }
        } catch (err) {
          console.debug("Failed to fetch profile during login", err);
        }

        navigate(role === "employee" ? "/portal" : "/dashboard");
      } else {
        // Admin registration — backend creates org + profile and returns a live session
        const res = await fetch(`${BACKEND}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        if (data.session) {
          // Backend returned a live session — set it in Supabase client and redirect
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          navigate("/dashboard");
        } else {
          // Fallback: no service role key — user needs to sign in manually
          alert("Account created! Please sign in.");
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWeb3ModalLaunch = async () => {
    try {
      setIsSigningWeb3(true);
      await open();
    } catch (err) {
      console.error(err);
      setError("Failed to open Web3 Modal");
      setIsSigningWeb3(false);
    }
  };

  // This hook runs whenever walletProvider changes (user connects a wallet)
  useEffect(() => {
    const handleLoginWithProvider = async () => {
      // Must have provider, be connected, have an address selected, AND specifically be requesting sign-in
      if (!walletProvider || !isConnected || !address || !isSigningWeb3) return;
      // Prevent double-invocation: React may re-run the effect if multiple deps change at once
      if (signingInProgress.current) return;
      signingInProgress.current = true;

      setError(null);
      setLoading(true);

      try {
        await supabase.auth.getSession();

        // Small delay to allow the WalletConnect connection modal to fully close
        // before requesting personal_sign — prevents "request was aborted" race condition
        await new Promise((resolve) => setTimeout(resolve, 800));

        // 1. Build a proper EIP-4361 SIWE message — Supabase requires at least 6 lines
        const domain = window.location.host; // e.g. "localhost:5173"
        const uri = window.location.origin; // e.g. "http://localhost:5173"
        const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        const issuedAt = new Date().toISOString();
        const message = [
          `${domain} wants you to sign in with your Ethereum account:`,
          address,
          ``,
          `Sign in to AI-HRMS`,
          ``,
          `URI: ${uri}`,
          `Version: 1`,
          `Chain ID: 1`,
          `Nonce: ${nonce}`,
          `Issued At: ${issuedAt}`,
        ].join("\n");

        // Convert to hex for raw JSON-RPC
        const hexMessage =
          "0x" +
          Array.from(new TextEncoder().encode(message))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        // 2. Request the user to cryptographically sign the message using raw WalletConnect Provider
        const signature = await walletProvider.request({
          method: "personal_sign",
          params: [hexMessage, address],
        });

        // 3. Send the message + signature to our own backend for verification.
        // The backend uses ethers.verifyMessage to confirm the wallet signed it,
        // then creates/retrieves a Supabase user and returns a live session.
        const resp = await fetch(`${BACKEND}/api/auth/web3-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, message, signature }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Web3 login failed");

        // Set the session in the Supabase client so AuthContext picks it up
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (data.isNewUser) {
          // First time this wallet has logged in — collect name + org before redirecting
          setWeb3Onboard({ session: data.session, role: data.profile?.role });
        } else {
          navigate(
            data.profile?.role === "employee" ? "/portal" : "/dashboard",
          );
        }
      } catch (err) {
        setError(err.message || "Failed to sign in with Web3");
      } finally {
        signingInProgress.current = false;
        setLoading(false);
        setIsSigningWeb3(false);
      }
    };

    handleLoginWithProvider();
  }, [walletProvider, isConnected, address, isSigningWeb3, navigate]);

  // Saves display name + org name for a brand-new Web3 user
  const handleWeb3Onboard = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/auth/web3-onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${web3Onboard.session.access_token}`,
        },
        body: JSON.stringify({ name: onboardName, org_name: onboardOrg }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save profile");
      }
      // Refresh the cached profile in AuthContext so Navbar shows the new name immediately
      if (refreshProfile) await refreshProfile();
      navigate(web3Onboard.role === "employee" ? "/portal" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Web3 Onboarding Step (shown after new wallet connects) ───────────────────
  if (web3Onboard) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl w-full max-w-md p-10">
          <div className="flex items-center gap-2 mb-8 text-blue-600">
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontFamily: "Material Symbols Outlined" }}
            >
              grid_view
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              AI-HRMS
            </span>
          </div>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium px-3 py-1.5 rounded-full mb-4">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                verified
              </span>
              Wallet verified
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              One last step!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Tell us your name and organisation so we can set up your account.
            </p>
          </div>

          <form onSubmit={handleWeb3Onboard} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold">
                Your Name
              </span>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  person
                </span>
                <input
                  required
                  type="text"
                  value={onboardName}
                  onChange={(e) => setOnboardName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 h-12 pl-11 pr-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold">
                Organisation Name
              </span>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  domain
                </span>
                <input
                  required
                  type="text"
                  value={onboardOrg}
                  onChange={(e) => setOnboardOrg(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 h-12 pl-11 pr-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Get Started →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {/* Main Card Container */}
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden flex flex-col lg:flex-row w-full max-w-[1100px] min-h-[640px]">
          {/* Left Panel: Branding & Marketing */}
          <div className="relative hidden lg:flex flex-col justify-between w-5/12 bg-blue-600 dark:bg-slate-900 p-12 text-white">
            <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent"></div>
            <div
              className="absolute bottom-0 left-0 w-full h-full z-0 opacity-10"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLeahMw_WDLRFgdEXsvKjjdFo2QlQ9Oxxjq9Uf0_3zuG-oNZ4bUFzrY8iwHmKotXUu00jDPlCeSOLvz0lF56hOFISNq5Crqu_DX3_iHF7ae7ZRvzK5MEChf3bIsoV1PIrzf0siygnQFuCLW4gi14wa-Caa0f31FyArY8biZstdm19jPWZdJsFAYI0sXw2B78PAJoGTHpgoehYgRL6_X4-ZPpwheys5mJsWARk3wTIOzyOcvwlgJraq21toJEGMM0vQVHv6Vvn4ELQ')",
              }}
            ></div>

            <div className="relative z-10 flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-white text-2xl"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  grid_view
                </span>
              </div>
              <span className="text-xl font-bold tracking-tight">AI-HRMS</span>
            </div>

            <div className="relative z-10 my-auto">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] mb-6">
                Transforming HR with AI Intelligence
              </h1>
              <p className="text-white/80 text-lg font-normal leading-relaxed">
                Streamline your workforce management securely and efficiently.
                Experience the future of human resources today.
              </p>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  verified_user
                </span>
                <span>Enterprise Grade Security</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white dark:bg-slate-800 relative">
            <div className="lg:hidden flex items-center gap-2 mb-8 text-blue-600">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                grid_view
              </span>
              <span className="text-xl font-bold">AI-HRMS</span>
            </div>

            <div className="max-w-[440px] w-full mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {isLogin
                    ? "Log in to your dashboard"
                    : "Create new organization"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  {isLogin
                    ? "Welcome back! Please enter your details."
                    : "Sign up and build your AI workforce today."}
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {!isLogin && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold">
                      Organization Name
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontFamily: "Material Symbols Outlined" }}
                        >
                          domain
                        </span>
                      </span>
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 h-12 pl-11 pr-4 text-base placeholder:text-slate-400 text-slate-900 dark:text-white transition-all duration-200"
                        placeholder="Acme Corp"
                      />
                    </div>
                  </label>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold">
                    Work Email
                  </span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        mail
                      </span>
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 h-12 pl-11 pr-4 text-base placeholder:text-slate-400 text-slate-900 dark:text-white transition-all duration-200"
                      placeholder="name@company.com"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold">
                      Password
                    </span>
                    {isLogin && (
                      <a
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        href="#"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        lock
                      </span>
                    </span>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 h-12 pl-11 pr-12 text-base placeholder:text-slate-400 text-slate-900 dark:text-white transition-all duration-200"
                      placeholder="Enter your password"
                    />
                  </div>
                </label>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <span>
                      {loading
                        ? "Processing..."
                        : isLogin
                          ? "Sign In"
                          : "Sign Up"}
                    </span>
                    <span
                      className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform"
                      style={{ fontFamily: "Material Symbols Outlined" }}
                    >
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-slate-800 text-slate-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleWeb3ModalLaunch}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200 w-full disabled:opacity-50"
                >
                  <img
                    alt="WalletConnect Logo"
                    className="w-5 h-5 object-contain"
                    src="https://walletconnect.com/favicon.ico"
                  />
                  Sign in with Web3 (WalletConnect)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <img
                    alt="Microsoft Logo"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGCjy_cNioKViwJFolWeHMuNvoswwO2xMz2LV6EM1jJW6Wn8dkWB5I-dcV7668z3Ml7dZLEBwyOucgmVpUwUfGuXzmAOV2o1ptuKSeQeLuydSdDXuttyr9BsN9ykWN1ZMaGIgqv7PNdrjsYHmixHGUo1w83Yr6hdF1mDpX8FgwiVDpoX7Bp_coU695AeEy9P-sDF_Esdm_TLsrV635YXBfmxINx1sj_CP8Y44R8VV3cD8AV4GaivR8zbCa0dQ3AiO992_03zvgn0U"
                  />
                  Microsoft
                </button>
              </div>

              <div className="mt-8 text-center text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isLogin
                    ? "Create a new organization account"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full text-center">
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <a
                  className="hover:text-slate-600 dark:hover:text-slate-300"
                  href="#"
                >
                  Privacy Policy
                </a>
                <span>•</span>
                <a
                  className="hover:text-slate-600 dark:hover:text-slate-300"
                  href="#"
                >
                  Terms of Service
                </a>
                <span>•</span>
                <a
                  className="hover:text-slate-600 dark:hover:text-slate-300"
                  href="#"
                >
                  Help
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
