import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import BACKEND from "../api";

const Profile = () => {
  const { user, userProfile, session, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    profile_picture_url: "",
    job_title: "",
    department: "",
    primary_skills: "",
    secondary_skills: "",
    skill_proficiency: "Intermediate",
    certifications: "",
    preferred_domain: "Backend",
  });

  // Load existing profile data on mount
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        profile_picture_url: userProfile.profile_picture_url || "",
        job_title: userProfile.job_title || "",
        department: userProfile.department || "",
        primary_skills: userProfile.primary_skills?.join(", ") || "",
        secondary_skills: userProfile.secondary_skills?.join(", ") || "",
        skill_proficiency: userProfile.skill_proficiency || "Intermediate",
        certifications: userProfile.certifications?.join(", ") || "",
        preferred_domain: userProfile.preferred_domain || "Backend",
      });
    }
  }, [userProfile]);

  const handleFileChange = async (e) => {
    try {
      setErrorMsg("");
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      setLoading(true);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormData({ ...formData, profile_picture_url: data.publicUrl });
      setLoading(false);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMsg("Error uploading image: " + error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        ...formData,
        primary_skills: formData.primary_skills
          ? formData.primary_skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        secondary_skills: formData.secondary_skills
          ? formData.secondary_skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        certifications: formData.certifications
          ? formData.certifications
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : [],
      };

      const res = await fetch(`${BACKEND}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      setSuccessMsg("Profile saved successfully!");
      if (refreshProfile) refreshProfile();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative -m-6 lg:-m-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-6 lg:px-8 pt-8 pb-8 bg-slate-50 dark:bg-slate-950 z-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your personal information, expertise, and avatar.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Left Column - Avatar & Identity */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center shadow-sm">
              <div className="relative mb-6">
                <div className="size-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-inner">
                  {formData.profile_picture_url ? (
                    <img
                      src={formData.profile_picture_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <span
                        className="material-symbols-outlined text-[64px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        person
                      </span>
                    </div>
                  )}
                </div>
                {loading && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span
                      className="material-symbols-outlined animate-spin text-blue-600 dark:text-blue-400 text-3xl"
                      style={{ fontFamily: "Material Symbols Outlined" }}
                    >
                      progress_activity
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {formData.full_name || "New User"}
              </h2>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {formData.job_title || "Designation Not Set"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1 justify-center">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  corporate_fare
                </span>
                {formData.department || "Department Not Set"}
              </p>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  upload
                </span>
                Upload new picture
              </button>

              {/* Read-only account info */}
              <div className="w-full mt-4 space-y-3 text-left">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {user?.email || "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    Role
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      userProfile?.role === "admin"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {userProfile?.role || "employee"}
                  </span>
                </div>
                {userProfile?.wallet_address && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                      Wallet
                    </p>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                      {userProfile.wallet_address.slice(0, 8)}...
                      {userProfile.wallet_address.slice(-6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="w-full lg:w-2/3">
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="p-8 space-y-8">
                {/* Section 1: Personal Info */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            job_title: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        placeholder="e.g. Senior Developer"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        placeholder="e.g. Engineering"
                      />
                    </div>
                  </div>
                </section>

                {/* Section 2: Skills & Expertise */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 mt-4">
                    Skills & Expertise
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Primary Skills (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.primary_skills}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primary_skills: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        placeholder="e.g. React, Node.js, Python"
                      />
                      {formData.primary_skills && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.primary_skills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-700/30"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Secondary Skills (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.secondary_skills}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            secondary_skills: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        placeholder="e.g. AWS, Docker, Figma"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Skill Proficiency
                      </label>
                      <select
                        value={formData.skill_proficiency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            skill_proficiency: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer appearance-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Preferred Work Domain
                      </label>
                      <select
                        value={formData.preferred_domain}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferred_domain: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer appearance-none"
                      >
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="Full Stack">Full Stack</option>
                        <option value="Design">Design</option>
                        <option value="Operations">Operations</option>
                        <option value="Management">Management</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Certifications (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.certifications}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            certifications: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        placeholder="e.g. AWS Certified Developer, PMP"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {errorMsg && (
                    <span className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        error
                      </span>
                      {errorMsg}
                    </span>
                  )}
                  {successMsg && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        check_circle
                      </span>
                      {successMsg}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontFamily: "Material Symbols Outlined" }}
                  >
                    save
                  </span>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
