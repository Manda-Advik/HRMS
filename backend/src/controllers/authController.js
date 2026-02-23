const { supabase, supabaseAdmin } = require("../db");

const SITE_URL = process.env.SITE_URL || "http://localhost:5173";

// ── Admin registration ────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({
        error:
          "Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing. Registration cannot bypass RLS.",
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });

    // Block duplicate email registrations early
    const { data: existingOrg } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("email", email)
      .single();
    if (existingOrg)
      return res.status(409).json({
        error: "An account with this email already exists. Please sign in.",
      });

    let userId;

    if (supabaseAdmin) {
      // Use admin client — creates user with email pre-confirmed, no verification email sent
      const { data: adminData, error: adminError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });
      if (adminError)
        return res.status(400).json({ error: adminError.message });
      userId = adminData.user.id;
    } else {
      // Fallback (no service role key): standard signUp — requires email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (authError) return res.status(400).json({ error: authError.message });
      userId = authData.user?.id;
    }

    if (!userId)
      return res.status(500).json({ error: "Failed to create user" });

    // Create org record — conflict on primary key (id) only
    const { error: orgError } = await supabaseAdmin
      .from("organizations")
      .upsert(
        { id: userId, name, email, password_hash: "managed_by_supabase_auth" },
        { onConflict: "id" },
      );
    if (orgError) {
      console.error("Org upsert error:", orgError.message);
      return res
        .status(500)
        .json({ error: "Failed to create organization: " + orgError.message });
    }

    // Create admin profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        { id: userId, org_id: userId, role: "admin" },
        { onConflict: "id" },
      );
    if (profileError) {
      console.error("Profile upsert error:", profileError.message);
      return res
        .status(500)
        .json({ error: "Failed to create profile: " + profileError.message });
    }

    // Sign in immediately so the frontend gets a live session
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return res.status(201).json({
        user: { id: userId, email },
        session: null,
        requiresLogin: true,
      });
    }

    res
      .status(201)
      .json({ user: signInData.user, session: signInData.session });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (authError) return res.status(401).json({ error: authError.message });

    res.json({ user: authData.user, session: authData.session });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Admin sends an invite ─────────────────────────────────────────────────────
const inviteEmployee = async (req, res) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({
        error: "Service role key not configured — cannot send invites",
      });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const orgId = req.userProfile.org_id;
    const invitedBy = req.user.id;

    // Check if already invited
    const { data: existing } = await supabaseAdmin
      .from("invitations")
      .select("id, status")
      .match({ org_id: orgId, email })
      .single();

    if (existing) {
      if (existing.status === "accepted")
        return res
          .status(409)
          .json({ error: "This person has already joined your org" });
      return res
        .status(409)
        .json({ error: "Invite already sent to this email" });
    }

    // Send invite email via Supabase
    const { error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${SITE_URL}/accept-invite`,
      });
    if (inviteError)
      return res.status(400).json({ error: inviteError.message });

    // Record the invitation
    const { data: invitation, error: dbError } = await supabaseAdmin
      .from("invitations")
      .insert({
        org_id: orgId,
        invited_by: invitedBy,
        email,
        status: "pending",
      })
      .select()
      .single();
    if (dbError) throw dbError;

    res.status(201).json({ message: "Invite sent", invitation });
  } catch (error) {
    console.error("Invite error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Invitee completes their profile after clicking the email link ─────────────
const completeInvite = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Find the pending invitation for this email
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("email", userEmail)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation)
      return res
        .status(404)
        .json({ error: "No pending invitation found for this email" });

    const orgId = invitation.org_id;
    const displayName = req.body.name || userEmail.split("@")[0];

    // Create employee record
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .insert({
        org_id: orgId,
        name: displayName,
        role: "Employee",
        department: "General",
      })
      .select()
      .single();
    if (empError) throw empError;

    // Create user_profile as employee
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .upsert({
        id: userId,
        org_id: orgId,
        role: "employee",
        employee_id: employee.id,
      });
    if (profileError) throw profileError;

    // Mark invite as accepted
    await supabaseAdmin
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    res.json({
      message: "Onboarding complete",
      role: "employee",
      employee_id: employee.id,
    });
  } catch (error) {
    console.error("Complete invite error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Updates the user's profile information ─────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      profile_picture_url,
      job_title,
      department,
      primary_skills,
      secondary_skills,
      skill_proficiency,
      certifications,
      preferred_domain,
    } = req.body;

    const { data: profile, error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        full_name,
        profile_picture_url,
        job_title,
        department,
        primary_skills,
        secondary_skills,
        skill_proficiency,
        certifications,
        preferred_domain,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    res.json(profile);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Web3 Onboarding — save name + org after first wallet login ────────────────
const web3Onboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, org_name } = req.body;
    if (!name || !org_name)
      return res.status(400).json({ error: "name and org_name are required" });

    // Save display name on user_profiles
    await supabaseAdmin
      .from("user_profiles")
      .update({ full_name: name })
      .eq("id", userId);

    // Save org name on organizations (upsert in case row doesn't exist yet)
    await supabaseAdmin
      .from("organizations")
      .upsert({ id: userId, name: org_name }, { onConflict: "id" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("web3Onboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Web3 Wallet Login ─────────────────────────────────────────────────────────
// Verifies a SIWE signature, then finds-or-creates a Supabase user keyed on
// the wallet address stored in user_profiles (not a fragile email/password pair).
const web3Login = async (req, res) => {
  try {
    const { address, message, signature } = req.body;
    if (!address || !message || !signature) {
      return res
        .status(400)
        .json({ error: "address, message, and signature are required" });
    }

    // 1. Verify the signature cryptographically
    const { ethers } = require("ethers");
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      return res.status(401).json({ error: "Invalid signature" });
    }
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res
        .status(401)
        .json({ error: "Signature does not match address" });
    }

    const walletAddr = address.toLowerCase();

    // 2. Source of truth: check user_profiles for this wallet address
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id, role, full_name")
      .eq("wallet_address", walletAddr)
      .single();

    const walletEmail = `${walletAddr}@wallet.hrms.local`;
    const walletPassword = ethers
      .keccak256(
        ethers.toUtf8Bytes(walletAddr + process.env.SUPABASE_SERVICE_ROLE_KEY),
      )
      .slice(0, 32);

    if (existingProfile) {
      // ── RETURNING USER ──────────────────────────────────────────────────────
      // Refresh their auth password to current value (handles key rotation or
      // first-time login after a backend restart) then sign them in.
      await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
        password: walletPassword,
        email_confirm: true,
      });

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: walletEmail,
          password: walletPassword,
        });

      if (signInError || !signInData?.session) {
        console.error("Web3 returning sign-in failed:", signInError?.message);
        return res
          .status(401)
          .json({ error: "Failed to authenticate returning wallet" });
      }

      const isNewUser = !existingProfile.full_name;
      return res.json({
        session: signInData.session,
        user: signInData.user,
        profile: existingProfile,
        isNewUser,
      });
    }

    // ── NEW WALLET ──────────────────────────────────────────────────────────
    if (!supabaseAdmin)
      return res.status(500).json({ error: "Server configuration error" });

    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: walletEmail,
        password: walletPassword,
        email_confirm: true,
        user_metadata: {
          wallet_address: address,
          name: `${address.slice(0, 6)}...${address.slice(-4)}`,
        },
      });
    if (createError)
      return res.status(500).json({ error: createError.message });

    // Create a profile row so the wallet is registered for future logins
    // Web3 users who register their own org are admins by default
    await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          id: newUser.user.id,
          org_id: newUser.user.id,
          role: "admin",
          wallet_address: walletAddr,
        },
        { onConflict: "id" },
      );

    // Sign in immediately to return a live session
    const { data: freshSession, error: freshError } =
      await supabase.auth.signInWithPassword({
        email: walletEmail,
        password: walletPassword,
      });
    if (freshError || !freshSession?.session) {
      return res
        .status(500)
        .json({ error: "User created but sign-in failed. Please try again." });
    }

    return res.json({
      session: freshSession.session,
      user: freshSession.user,
      profile: { role: "admin" },
      isNewUser: true,
    });
  } catch (err) {
    console.error("Web3 login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Returns the calling user's profile ────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ user: req.user, profile: req.userProfile });
};

module.exports = {
  register,
  login,
  web3Login,
  web3Onboard,
  inviteEmployee,
  completeInvite,
  updateProfile,
  getMe,
};
