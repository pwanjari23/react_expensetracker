import React, { useState } from "react";
import { auth, db, isDummyConfig } from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CompleteProfile({ user, onProfileUpdated, onCancel }) {
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Compute a mock completion percentage based on filled fields
  const completionPct = [
    user?.email ? 1 : 0,
    fullName.trim() ? 1 : 0,
    photoURL.trim() ? 1 : 0,
  ].reduce((a, b) => a + b, 0);
  const completionLabel = Math.round((completionPct / 3) * 100);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isDummyConfig || !auth) {
        // DEMO MOCK MODE
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Mock profile updated:", { fullName, photoURL });
        setSuccess(true);
        setTimeout(() => {
          onProfileUpdated({ displayName: fullName, photoURL });
        }, 1200);
      } else {
        // LIVE FIREBASE
        // 1. Update Firebase Auth profile (displayName & photoURL)
        await updateProfile(auth.currentUser, {
          displayName: fullName.trim(),
          photoURL: photoURL.trim() || null,
        });

        // 2. Persist extended profile data in Firestore
        if (db) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await setDoc(
            userRef,
            {
              uid: auth.currentUser.uid,
              email: auth.currentUser.email,
              displayName: fullName.trim(),
              photoURL: photoURL.trim() || null,
              profileCompleted: true,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        setSuccess(true);
        setTimeout(() => {
          onProfileUpdated({
            displayName: fullName.trim(),
            photoURL: photoURL.trim() || null,
          });
        }, 1200);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none animate-float-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-900/15 blur-[140px] pointer-events-none animate-float-2" />

      {/* Top Navigation / Header */}
      <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-950">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              FinFlow
            </span>
          </div>

          {/* Right: Profile completion notice */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span className="text-xs text-amber-300 font-medium">
                  Your Profile is{" "}
                  <span className="font-bold text-amber-200">{completionLabel}%</span> completed.
                  A complete Profile unlocks all features.
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 max-w-[150px] truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center z-10 px-4 pt-12 pb-20">
        <div className="w-full max-w-2xl space-y-6">

          {/* Page Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Profile Setup</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Complete Your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Profile</span>
            </h1>
            <p className="text-slate-400 text-sm">Add your details to personalize your FinFlow experience.</p>
          </div>

          {/* Profile Completion Progress */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Completion</span>
              <span className="text-xs font-bold text-indigo-400">{completionLabel}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${completionLabel}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Complete your profile to get full access to FinFlow features.
            </p>
          </div>

          {/* Contact Details Card */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden glow-border">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600/8 rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">Contact Details</h2>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-300">Profile Updated Successfully!</div>
                  <div className="text-xs text-emerald-500 mt-0.5">Redirecting to your dashboard...</div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3.5 bg-rose-950/30 border border-rose-900/40 rounded-2xl text-rose-400 text-xs font-semibold flex items-start space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleUpdate} className="space-y-6">

              {/* Two-Column Grid for Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-500">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                    <span>Full Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      {/* GitHub-style person icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                      </svg>
                    </div>
                    <input
                      id="profile-full-name"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs text-white placeholder-slate-600 transition"
                      required
                    />
                  </div>
                </div>

                {/* Profile Photo URL */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-500">
                      <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.003-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
                    </svg>
                    <span>Profile Photo URL</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      {/* Globe icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-1.503.204A6.5 6.5 0 1 0 4.91 13.192a.75.75 0 0 1 .039-.008A15.057 15.057 0 0 0 8 13.5a15.05 15.05 0 0 0 3.048-.316l.002.001A6.5 6.5 0 0 0 16.497 10.204Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="profile-photo-url"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs text-white placeholder-slate-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Preview */}
              {photoURL && (
                <div className="flex items-center space-x-4 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 bg-slate-800">
                    <img
                      src={photoURL}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">{fullName || "Your Name"}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{user?.email}</div>
                    <div className="text-[10px] text-indigo-400 mt-1 font-semibold">Profile Preview</div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-900" />

              {/* Submit Button */}
              <div className="flex items-center space-x-4">
                <button
                  id="update-profile-btn"
                  type="submit"
                  disabled={loading || success}
                  className={`px-8 py-3 text-xs font-bold rounded-xl transition shadow-lg relative overflow-hidden select-none active:scale-[0.98] ${
                    loading || success
                      ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-indigo-600/20 cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Updating...</span>
                    </span>
                  ) : success ? (
                    <span className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-emerald-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className="text-emerald-400">Updated!</span>
                    </span>
                  ) : (
                    "Update Profile"
                  )}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-300 transition"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-5 border-t border-slate-900 text-xs text-slate-600 z-10">
        © {new Date().getFullYear()} FinFlow. All rights reserved.
      </footer>
    </div>
  );
}
