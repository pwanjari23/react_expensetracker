import React, { useState, useEffect } from "react";
import { auth, isDummyConfig } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import CompleteProfile from "./CompleteProfile";

export default function Signup() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Email verification states
  const [verifyEmailLoading, setVerifyEmailLoading] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [verifyEmailError, setVerifyEmailError] = useState("");
  const [recheckingVerification, setRecheckingVerification] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Password strength calculation
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "Empty", color: "bg-slate-700" });

  // Post-Signup Dashboard states
  const [transactions, setTransactions] = useState([]);
  const [txName, setTxName] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Food");
  const [editingTxId, setEditingTxId] = useState(null);

  const [savingsGoal, setSavingsGoal] = useState({
    name: "MacBook Air M3",
    target: 1200.00,
    saved: 450.00
  });

  const contributeToGoal = (amount) => {
    const newTx = {
      id: Date.now(),
      name: `Goal Contribution: ${savingsGoal.name}`,
      amount: -amount,
      category: "Savings",
      date: "Today"
    };
    setTransactions([newTx, ...transactions]);
    setSavingsGoal(prev => ({
      ...prev,
      saved: Math.min(prev.saved + amount, prev.target)
    }));
  };


  // ─── Helper: Fetch user profile from Firebase REST API using idToken ───────
  const fetchProfileFromFirebase = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );
      const data = await res.json();
      if (data.users && data.users[0]) {
        const u = data.users[0];
        return {
          uid: u.localId,
          email: u.email,
          displayName: u.displayName || null,
          photoURL: u.photoUrl || null,
          emailVerified: u.emailVerified || false,
          _idToken: idToken, // cache for verification calls
        };
      }
    } catch (err) {
      console.error("Failed to fetch profile from Firebase REST API:", err);
    }
    // Fallback to SDK user object
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified || false,
    };
  };

  // ─── Auto-restore session on page refresh via onAuthStateChanged ─────────
  useEffect(() => {
    if (isDummyConfig || !auth) {
      setAuthChecking(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User already logged in — fetch fresh profile data from Firebase REST API
        const profile = await fetchProfileFromFirebase(firebaseUser);
        setUser(profile);
        setSuccess(true);
        // Reset banner dismissal so it re-evaluates based on fresh profile data
        setProfileBannerDismissed(false);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Send email verification via Firebase REST API (accounts:sendOobCode) ─────
  const sendVerificationEmail = async () => {
    setVerifyEmailLoading(true);
    setVerifyEmailError("");
    setVerifyEmailSent(false);

    try {
      if (isDummyConfig || !auth || !auth.currentUser) {
        // DEMO MOCK MODE
        await new Promise((r) => setTimeout(r, 1000));
        setVerifyEmailSent(true);
        return;
      }

      // Always get a fresh idToken before sending
      const idToken = await auth.currentUser.getIdToken(true);

      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "VERIFY_EMAIL",
            idToken,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        // — Handle all documented error codes from the Firebase REST API docs —
        const code = data.error.message;
        let readable;

        switch (code) {
          case "INVALID_ID_TOKEN":
            readable = "Your session token is invalid or expired. Please sign out and sign back in, then try again.";
            break;
          case "USER_NOT_FOUND":
          case "EMAIL_NOT_FOUND":
            readable = "No account was found for this email. The account may have been deleted.";
            break;
          case "USER_DISABLED":
            readable = "Your account has been disabled by an administrator. Please contact support.";
            break;
          case "TOO_MANY_REQUESTS":
            readable = "Too many requests. Firebase has temporarily blocked this action. Please wait a few minutes and try again.";
            break;
          case "MISSING_EMAIL":
            readable = "No email address is associated with this account.";
            break;
          case "RESET_PASSWORD_EXCEED_LIMIT":
            readable = "Too many email verification requests. Please wait before requesting another.";
            break;
          default:
            readable = data.error.message || "Failed to send verification email. Please try again.";
        }

        setVerifyEmailError(readable);
        return;
      }

      // Success — email sent
      setVerifyEmailSent(true);
      console.log("Verification email sent to:", data.email);

    } catch (err) {
      console.error("sendVerificationEmail error:", err);
      setVerifyEmailError("A network error occurred. Please check your connection and try again.");
    } finally {
      setVerifyEmailLoading(false);
    }
  };

  // ─── Fetch expenses from Firebase Realtime Database via REST API ───────────
  const fetchExpenses = async (uid) => {
    if (isDummyConfig || !auth || !auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const url = `https://${projectId}-default-rtdb.firebaseio.com/expenses/${uid}.json?auth=${idToken}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      if (data) {
        const loadedExpenses = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name,
          amount: parseFloat(data[key].amount),
          category: data[key].category,
          date: data[key].date || "Today",
        }));
        setTransactions(loadedExpenses.reverse());
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
      // Fallback try: standard database URL format
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        const fallbackUrl = `https://${projectId}.firebaseio.com/expenses/${uid}.json?auth=${idToken}`;
        const res = await fetch(fallbackUrl);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const loadedExpenses = Object.keys(data).map((key) => ({
              id: key,
              name: data[key].name,
              amount: parseFloat(data[key].amount),
              category: data[key].category,
              date: data[key].date || "Today",
            }));
            setTransactions(loadedExpenses.reverse());
          }
        }
      } catch (e) {
        console.error("Fallback fetching failed:", e);
      }
    }
  };

  // Fetch expenses when user uid is loaded / changed (login or refresh)
  useEffect(() => {
    if (user && user.uid) {
      fetchExpenses(user.uid);
    } else {
      setTransactions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ─── Re-check email verification status from Firebase REST API ────────────
  const recheckEmailVerification = async () => {
    if (!auth || !auth.currentUser) return;
    setRecheckingVerification(true);
    try {
      const freshProfile = await fetchProfileFromFirebase(auth.currentUser);
      setUser(freshProfile);
      if (freshProfile.emailVerified) {
        setVerifyEmailSent(false);
        setVerifyEmailError("");
      }
    } catch (err) {
      console.error("recheckEmailVerification error:", err);
    } finally {
      setRecheckingVerification(false);
    }
  };

  // ─── Calculate password strength ─────────────────────────────────────────
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: "Empty", color: "bg-slate-700 w-0" });
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = "Weak";
    let color = "bg-rose-500 w-1/4";
    if (score >= 4) {
      label = "Very Strong";
      color = "bg-emerald-500 w-full";
    } else if (score >= 3) {
      label = "Strong";
      color = "bg-teal-500 w-3/4";
    } else if (score >= 2) {
      label = "Fair";
      color = "bg-amber-500 w-1/2";
    }

    setPasswordStrength({ score, label, color });
  }, [password]);

  const isFormValid = isLogin 
    ? email.trim() !== "" && password.trim() !== ""
    : email.trim() !== "" && password.trim() !== "" && confirmPassword.trim() !== "";

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (isDummyConfig) {
        // DEMO MOCK AUTH
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUser({ email: email.toLowerCase(), isMock: true });
        setSuccess(true);
        console.log("User has successfully signed up.");
      } else {
        // LIVE FIREBASE AUTH
        if (isLogin) {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          // Fetch full profile data from Firebase REST API
          const profile = await fetchProfileFromFirebase(userCredential.user);
          setUser(profile);
          setSuccess(true);
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          // New user — no profile yet, set basic info
          const profile = await fetchProfileFromFirebase(userCredential.user);
          setUser(profile);
          setSuccess(true);
          console.log("User has successfully signed up.");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      let readableError = "An unexpected error occurred. Please try again.";
      const errorCode = err.code || err.message;

      switch (errorCode) {
        case "auth/email-already-in-use":
          readableError = "This email is already registered. Please log in instead.";
          break;
        case "auth/invalid-email":
          readableError = "The email address layout is invalid.";
          break;
        case "auth/weak-password":
          readableError = "The password is too weak. Choose a stronger one.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          readableError = "Invalid email or password combination.";
          break;
        case "auth/configuration-not-found":
          readableError = "Email/Password sign-in is not enabled in your Firebase console. Please go to your Firebase project under Authentication → Sign-in method, click Email/Password, and enable it.";
          break;
        default:
          readableError = err.message;
      }
      setError(readableError);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setError("");
    setForgotSuccess(false);

    try {
      if (isDummyConfig) {
        await new Promise((r) => setTimeout(r, 1000));
        setForgotSuccess(true);
        return;
      }

      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "PASSWORD_RESET",
            email: forgotEmail.trim(),
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        const code = data.error.message;
        let readable;
        switch (code) {
          case "INVALID_EMAIL":
            readable = "The email address is invalid.";
            break;
          case "USER_NOT_FOUND":
            readable = "No user was found with this email address.";
            break;
          case "MISSING_EMAIL":
            readable = "Email address is required.";
            break;
          default:
            readable = data.error.message || "Failed to send password reset email. Please try again.";
        }
        setError(readable);
        return;
      }

      setForgotSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 1. Sign out from Firebase (also clears Firebase-managed localStorage entries)
      if (!isDummyConfig && auth) {
        await signOut(auth);
      }

      // 2. Explicitly purge any Firebase / idToken keys from localStorage
      //    Firebase SDK stores auth state under keys like "firebase:authUser:[apiKey]:[appName]"
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith("firebase:") ||
              key.startsWith("firebaseLocalStorage") ||
              key.includes("idToken") ||
              key.includes("authUser") ||
              key.includes("firebaseui"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        // Also clear sessionStorage of any auth data
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn("Could not fully clear storage:", storageErr);
      }

      // 3. Reset all component state → redirects user back to the Login page
      setUser(null);
      setSuccess(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setProfileBannerDismissed(false);
      setShowCompleteProfile(false);
      setVerifyEmailSent(false);
      setVerifyEmailError("");
      setIsLogin(true); // Open login tab after logout
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!txName.trim() || !txAmount) return;

    let parsedAmount = parseFloat(txAmount);
    // If it is not Salary, treat as an expense (negative)
    if (txCategory !== "Salary" && parsedAmount > 0) {
      parsedAmount = -parsedAmount;
    } else if (txCategory === "Salary" && parsedAmount < 0) {
      parsedAmount = Math.abs(parsedAmount);
    }

    const originalTx = editingTxId ? transactions.find(t => t.id === editingTxId) : null;
    const newExpense = {
      name: txName.trim(),
      amount: parsedAmount,
      category: txCategory,
      date: originalTx ? originalTx.date : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };

    if (editingTxId) {
      // ─── UPDATE TRANSACTION (PUT) ───
      if (isDummyConfig || !auth || !auth.currentUser) {
        // Fallback for mock mode
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingTxId ? { ...t, ...newExpense } : t))
        );
        setEditingTxId(null);
        setTxName("");
        setTxAmount("");
        return;
      }

      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const uid = auth.currentUser.uid;
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        const url = `https://${projectId}-default-rtdb.firebaseio.com/expenses/${uid}/${editingTxId}.json?auth=${idToken}`;

        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newExpense),
        });

        if (!res.ok) {
          throw new Error(`Failed to update: ${res.status}`);
        }

        // Success PUT response -> update state
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingTxId ? { ...t, ...newExpense } : t))
        );
        setEditingTxId(null);
        setTxName("");
        setTxAmount("");
      } catch (err) {
        console.error("Error updating expense to RTDB:", err);
        // Fallback try: standard database URL format
        try {
          const idToken = await auth.currentUser.getIdToken(true);
          const uid = auth.currentUser.uid;
          const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
          const fallbackUrl = `https://${projectId}.firebaseio.com/expenses/${uid}/${editingTxId}.json?auth=${idToken}`;

          const res = await fetch(fallbackUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newExpense),
          });

          if (res.ok) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === editingTxId ? { ...t, ...newExpense } : t))
            );
            setEditingTxId(null);
            setTxName("");
            setTxAmount("");
          }
        } catch (e) {
          console.error("Fallback update failed:", e);
        }
      }
      return;
    }

    // ─── CREATE TRANSACTION (POST) ───
    if (isDummyConfig || !auth || !auth.currentUser) {
      // Fallback for mock mode
      const mockTx = {
        id: Date.now(),
        ...newExpense,
      };
      setTransactions((prev) => [mockTx, ...prev]);
      setTxName("");
      setTxAmount("");
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const uid = auth.currentUser.uid;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const url = `https://${projectId}-default-rtdb.firebaseio.com/expenses/${uid}.json?auth=${idToken}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });

      if (!res.ok) {
        throw new Error(`Failed to save: ${res.status}`);
      }

      const data = await res.json();
      if (data && data.name) {
        // 200/201 Success from backend -> update state/screen
        const savedTx = {
          id: data.name,
          ...newExpense,
        };
        setTransactions((prev) => [savedTx, ...prev]);
        setTxName("");
        setTxAmount("");
      }
    } catch (err) {
      console.error("Error saving expense to RTDB:", err);
      // Fallback try: standard database URL format
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const uid = auth.currentUser.uid;
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        const fallbackUrl = `https://${projectId}.firebaseio.com/expenses/${uid}.json?auth=${idToken}`;

        const res = await fetch(fallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newExpense),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            const savedTx = {
              id: data.name,
              ...newExpense,
            };
            setTransactions((prev) => [savedTx, ...prev]);
            setTxName("");
            setTxAmount("");
          }
        }
      } catch (e) {
        console.error("Fallback saving failed:", e);
      }
    }
  };

  const deleteExpense = async (id) => {
    if (isDummyConfig || !auth || !auth.currentUser) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      console.log("Expense successfuly deleted");
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const uid = auth.currentUser.uid;
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const url = `https://${projectId}-default-rtdb.firebaseio.com/expenses/${uid}/${id}.json?auth=${idToken}`;

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete: ${res.status}`);
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      console.log("Expense successfuly deleted");
    } catch (err) {
      console.error("Error deleting expense:", err);
      // Fallback try: standard database URL format
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const uid = auth.currentUser.uid;
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        const fallbackUrl = `https://${projectId}.firebaseio.com/expenses/${uid}/${id}.json?auth=${idToken}`;

        const res = await fetch(fallbackUrl, {
          method: "DELETE",
        });

        if (res.ok) {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          console.log("Expense successfuly deleted");
        }
      } catch (e) {
        console.error("Fallback deletion failed:", e);
      }
    }
  };

  const totalBalance = transactions.reduce((acc, curr) => acc + curr.amount, 12450.00);
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((acc, curr) => acc + curr.amount, 0);

  // Check if profile is incomplete (no displayName set)
  const isProfileIncomplete = !user?.displayName;

  // ─── Auth-checking loading screen ─────────────────────────────────────────
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-slate-950">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-slate-400 font-medium">Restoring your session...</span>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETE PROFILE PAGE VIEW
  if (showCompleteProfile && user) {
    return (
      <CompleteProfile
        user={user}
        onLogout={handleLogout}
        onProfileUpdated={async (updatedData) => {
          // Merge updated data immediately for instant UI feedback
          setUser((prev) => ({ ...prev, ...updatedData }));
          setShowCompleteProfile(false);
          setProfileBannerDismissed(true);
          // Re-fetch from Firebase REST API to ensure state matches the server
          if (!isDummyConfig && auth && auth.currentUser) {
            try {
              const freshProfile = await fetchProfileFromFirebase(auth.currentUser);
              setUser(freshProfile);
            } catch (e) {
              console.warn("Could not re-fetch profile after update:", e);
            }
          }
        }}
        onCancel={() => {
          setShowCompleteProfile(false);
          setProfileBannerDismissed(true);
        }}
      />
    );
  }

  // INTERACTIVE FINFLOW EXPENSE TRACKER DASHBOARD VIEW (Wow Factor)
  if (success && user) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col relative overflow-hidden font-sans">
        {/* Animated Background Mesh Blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[140px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-950/20 blur-[130px] pointer-events-none"></div>

        {/* Top Navigation */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-950">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FinFlow Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Profile Incomplete Banner */}
              {isProfileIncomplete && !profileBannerDismissed && (
                <div className="hidden sm:flex items-center space-x-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-1.5 animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-amber-400 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span className="text-xs text-amber-300">
                    Your profile is <span className="font-bold">Incomplete</span>.{" "}
                    <button
                      id="complete-profile-link"
                      onClick={() => setShowCompleteProfile(true)}
                      className="text-indigo-400 font-bold hover:text-indigo-300 underline transition"
                    >
                      Complete now
                    </button>
                  </span>
                  <button
                    onClick={() => setProfileBannerDismissed(true)}
                    className="text-slate-600 hover:text-slate-400 ml-1 transition"
                    aria-label="Dismiss"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 max-w-[150px] truncate">
                {user.displayName || user.email}
              </span>
              {/* Email Verification Button (desktop, unverified only) */}
              {!user.emailVerified && (
                <button
                  id="verify-email-btn"
                  onClick={sendVerificationEmail}
                  disabled={verifyEmailLoading || verifyEmailSent}
                  className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                    verifyEmailSent
                      ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400 cursor-default"
                      : "bg-rose-950/30 border-rose-900/50 text-rose-400 hover:border-rose-700/60 hover:text-rose-300 cursor-pointer active:scale-95"
                  }`}
                  title="Your email is not verified. Click to send a verification link."
                >
                  {verifyEmailLoading ? (
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : verifyEmailSent ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  )}
                  <span>{verifyEmailSent ? "Email Sent!" : "Verify Email"}</span>
                </button>
              )}
              {user.emailVerified && (
                <span className="hidden sm:flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-2.5 py-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>Verified</span>
                </span>
              )}
              <button
                id="logout-btn"
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl transition shadow-md shadow-rose-900/30 disabled:opacity-50"
                title="Logout and return to login page"
              >
                {loading ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                  </svg>
                )}
                <span>{loading ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {/* Mobile: Profile Incomplete Banner */}
        {isProfileIncomplete && !profileBannerDismissed && (
          <div className="sm:hidden mx-4 mt-4 flex items-center space-x-3 bg-amber-950/30 border border-amber-800/40 rounded-2xl px-4 py-3 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-400 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span className="text-xs text-amber-300 flex-1">
              Your profile is <span className="font-bold">Incomplete</span>.{" "}
              <button
                onClick={() => setShowCompleteProfile(true)}
                className="text-indigo-400 font-bold underline"
              >
                Complete now
              </button>
            </span>
            <button onClick={() => setProfileBannerDismissed(true)} className="text-slate-500 hover:text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Email Verification banner (mobile) */}
        {!user.emailVerified && (
          <div className="sm:hidden mx-4 mt-2 flex items-center space-x-3 bg-rose-950/30 border border-rose-800/40 rounded-2xl px-4 py-3 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-rose-400 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span className="text-xs text-rose-300 flex-1">
              Email not verified.{" "}
              <button
                onClick={sendVerificationEmail}
                disabled={verifyEmailLoading || verifyEmailSent}
                className="text-indigo-400 font-bold underline disabled:opacity-50"
              >
                {verifyEmailSent ? "Sent!" : "Verify now"}
              </button>
            </span>
          </div>
        )}
        <main className="max-w-7xl mx-auto px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 z-10">
          
          {/* Left Column: Stat Cards and Add Transaction Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Email Verification Alert Card (desktop, full width inside left col) ── */}
            {!user.emailVerified && (
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 backdrop-blur-sm animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-rose-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-rose-300">Email Not Verified</div>
                      <div className="text-xs text-rose-400/80 mt-0.5">
                        {verifyEmailSent
                          ? `A verification link has been sent to ${user.email}. Check your inbox and click the link to verify.`
                          : `Verify your email address to secure your account and enable password recovery.`}
                      </div>
                      {/* Error message */}
                      {verifyEmailError && (
                        <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/30 rounded-lg px-3 py-2">
                          ⚠ {verifyEmailError}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {verifyEmailSent && (
                      <button
                        id="recheck-verification-btn"
                        onClick={recheckEmailVerification}
                        disabled={recheckingVerification}
                        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 hover:border-emerald-700/50 rounded-lg transition disabled:opacity-50"
                      >
                        {recheckingVerification ? (
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        )}
                        <span>{recheckingVerification ? "Checking..." : "I've verified, check status"}</span>
                      </button>
                    )}
                    {!verifyEmailSent && (
                      <button
                        id="send-verification-email-btn"
                        onClick={sendVerificationEmail}
                        disabled={verifyEmailLoading}
                        className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 rounded-lg transition shadow-md shadow-rose-900/20 disabled:opacity-50 active:scale-[0.98]"
                      >
                        {verifyEmailLoading ? (
                          <>
                            <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            <span>Verify Email</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Realtime Stats Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
                <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">Net Balance</span>
                <div className="text-2xl font-bold mt-2 text-white">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">▲ +8.2% from last month</div>
                <div className="absolute top-0 right-0 h-full w-1.5 bg-indigo-500"></div>
              </div>
              {/* Card 2 */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
                <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">Total Income</span>
                <div className="text-2xl font-bold mt-2 text-emerald-400">+${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-[11px] text-slate-500 mt-1">This session test activities</div>
                <div className="absolute top-0 right-0 h-full w-1.5 bg-emerald-500"></div>
              </div>
              {/* Card 3 */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
                <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">Total Expenses</span>
                <div className="text-2xl font-bold mt-2 text-rose-400">-${Math.abs(totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-[11px] text-slate-500 mt-1">All debit operations</div>
                <div className="absolute top-0 right-0 h-full w-1.5 bg-rose-500"></div>
              </div>
            </div>

            {/* Daily Expenses Tracker Form */}
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                <span className="h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                {editingTxId ? "Edit Daily Expense" : "Add Daily Expense"}
              </h3>
              <form onSubmit={addTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Money spent */}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Money he had spent ($)"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  required
                />
                {/* 2. Description */}
                <input
                  type="text"
                  placeholder="Description of the expense done"
                  value={txName}
                  onChange={(e) => setTxName(e.target.value)}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 md:col-span-2"
                  required
                />
                {/* 3. Category (Dropdown) */}
                <div className="flex space-x-2">
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 flex-1"
                  >
                    <option value="Food">Food</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Salary">Salary</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Others">Others</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center transition shadow-md shadow-indigo-600/10 active:scale-95"
                  >
                    {editingTxId ? "Update" : "Add"}
                  </button>
                  {editingTxId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTxId(null);
                        setTxName("");
                        setTxAmount("");
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 rounded-xl text-xs flex items-center justify-center transition active:scale-95"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Transactions Log */}
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Interactive Transactions Log</h3>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">{transactions.length} Records</span>
              </div>
              
              <div className="divide-y divide-slate-900 max-h-[280px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        tx.amount > 0 ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                      }`}>
                        {tx.category.substring(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{tx.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{tx.date} • {tx.category}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </div>
                      
                      {/* Action Buttons: Edit and Delete */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTxId(tx.id);
                            setTxName(tx.name);
                            setTxAmount(Math.abs(tx.amount).toString());
                            setTxCategory(tx.category);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-900 border border-slate-800 hover:border-indigo-900/50 rounded-lg transition active:scale-95"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpense(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-900/50 rounded-lg transition active:scale-95"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Custom Interactive Savings Goal & Category Breakdown */}
          <div className="space-y-6">
            
            {/* Savings Goal Card */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/70 to-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.879m4.003-1.636-.879.879m0-7.525.879-.879m-3.124.879-.879-.879M3.75 6H7.5m3.75 0h3.75m3.75 0h3.75m-11.25 6H7.5m3.75 0h3.75m3.75 0h3.75M3.75 18H7.5m3.75 0h3.75m3.75 0h3.75" />
                  </svg>
                  Savings Target
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">Active Goal</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-base font-bold text-slate-100">{savingsGoal.name}</div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Saved: ${savingsGoal.saved.toFixed(2)}</span>
                    <span>Target: ${savingsGoal.target.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative">
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${(savingsGoal.saved / savingsGoal.target) * 100}%` }}
                    ></div>
                  </div>
                  <span className="absolute -top-6 right-0 text-[10px] font-bold text-indigo-400">
                    {((savingsGoal.saved / savingsGoal.target) * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Contribution Action buttons */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Fund your target</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => contributeToGoal(20)}
                      disabled={totalBalance < 20 || savingsGoal.saved >= savingsGoal.target}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg text-slate-200 transition"
                    >
                      +$20
                    </button>
                    <button
                      onClick={() => contributeToGoal(50)}
                      disabled={totalBalance < 50 || savingsGoal.saved >= savingsGoal.target}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg text-slate-200 transition"
                    >
                      +$50
                    </button>
                    <button
                      onClick={() => contributeToGoal(100)}
                      disabled={totalBalance < 100 || savingsGoal.saved >= savingsGoal.target}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold rounded-lg text-slate-200 transition"
                    >
                      +$100
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Progress Bars Card */}
            <div className="bg-slate-950/30 border border-slate-900 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Expense Categories</h3>
              <div className="space-y-4">
                {/* Dynamically calculated category values */}
                {Object.entries(
                  transactions
                    .filter(t => t.amount < 0)
                    .reduce((acc, curr) => {
                      const cat = curr.category;
                      const amt = Math.abs(curr.amount);
                      acc[cat] = (acc[cat] || 0) + amt;
                      return acc;
                    }, {})
                ).map(([cat, amt]) => {
                  const totalExpenseAmount = Math.abs(transactions.filter(t => t.amount < 0).reduce((acc, curr) => acc + curr.amount, 0)) || 1;
                  const pct = (amt / totalExpenseAmount) * 100;
                  
                  const colors = {
                    Food: "from-teal-500 to-teal-400 text-teal-400 bg-teal-500/10",
                    Entertainment: "from-violet-500 to-violet-400 text-violet-400 bg-violet-500/10",
                    Shopping: "from-pink-500 to-pink-400 text-pink-400 bg-pink-500/10",
                    Bills: "from-amber-500 to-amber-400 text-amber-400 bg-amber-500/10",
                    Savings: "from-indigo-500 to-indigo-400 text-indigo-400 bg-indigo-500/10"
                  };
                  const colorClass = colors[cat] || "from-slate-500 to-slate-400 text-slate-400 bg-slate-500/10";

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300">{cat}</span>
                        <span className="text-slate-500 font-medium">${amt.toFixed(2)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]} rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {transactions.filter(t => t.amount < 0).length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No expenses recorded yet.</p>
                )}
              </div>
            </div>

          </div>

        </main>

        <footer className="w-full text-center py-5 border-t border-slate-900 text-xs text-slate-600 z-10">
          © {new Date().getFullYear()} FinFlow. Created with Google Gemini. All rights reserved.
        </footer>
      </div>
    );
  }

  // CORE AUTHENTICATION VIEW (Premium custom layout)
  return (
    <div className="min-h-screen bg-[#03060f] text-slate-200 flex flex-col relative overflow-hidden font-sans select-none">
      
      {/* Background neon blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none animate-float-1"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[380px] h-[380px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-float-2"></div>
      
      {/* Outer wrapper */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 lg:gap-20 z-10">
        
        {/* Left Side: Creative Panel (Only on desktop) */}
        <div className="flex-1 text-left hidden md:flex flex-col max-w-xl space-y-8 animate-fade-in">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-slate-950 shadow-xl shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm4.5 7.5a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Zm3.75-1.5a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0v-3.75a.75.75 0 0 1 .75-.75Zm3.75-3a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V7.5a.75.75 0 0 1 .75-.75Zm3.75 6a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">FinFlow</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Next-gen financial management platform.</p>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Take complete control of your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">financial destiny</span>.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track expenses in real-time, generate smart reports, and sync accounts securely. Built for modern builders.
            </p>
          </div>

          {/* Interactive mockup rotating glass card */}
          <div className="relative pt-6 max-w-sm">
            <div className="absolute top-10 left-6 w-[320px] h-[190px] bg-indigo-500/10 rounded-2xl blur-2xl animate-pulse"></div>
            {/* The holographic card */}
            <div className="w-[320px] h-[190px] rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-950 p-6 flex flex-col justify-between shadow-2xl relative backdrop-blur-lg transform hover:rotate-2 hover:scale-[1.02] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Premium Card</div>
                  <div className="text-lg font-bold tracking-tight text-slate-100 mt-1">FinFlow Elite</div>
                </div>
                <div className="h-6 w-8 bg-slate-800 rounded-md flex items-center justify-center opacity-60">
                  <span className="h-3 w-5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-sm"></span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Card number</div>
                <div className="text-sm font-mono text-slate-200 mt-0.5">••••  ••••  ••••  8824</div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase">Card Holder</div>
                  <div className="text-xs font-semibold text-slate-300">DEMO PROFILE</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase text-right">Expires</div>
                  <div className="text-xs font-semibold text-slate-300 text-right">09/31</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card (Responsive Glassmorphic Design) */}
        <div className="w-full max-w-[420px] flex flex-col space-y-6 animate-fade-in-delayed">
          
          <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden glow-border">
            
            {showForgotPassword ? (
              <div className="animate-fade-in">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                    Reset Password
                  </h2>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    Provide your register email address below. We'll send you a secure link to reset your password.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-6 p-3.5 bg-rose-950/30 border border-rose-900/40 rounded-2xl text-rose-400 text-xs font-semibold flex items-start space-x-2 animate-shake">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {forgotSuccess && (
                  <div className="mb-6 p-3.5 bg-emerald-950/30 border border-emerald-900/40 rounded-2xl text-emerald-400 text-xs font-semibold flex flex-col space-y-1 animate-fade-in">
                    <div className="flex items-start space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>Reset email sent successfully!</span>
                    </div>
                    <span className="text-[11px] text-emerald-500 pl-6 leading-relaxed">
                      A password reset link has been dispatched to <strong>{forgotEmail}</strong>. Open the link to update your password, then return here to log in.
                    </span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {/* Email Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.22a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                        <path d="m19 8.839-7.903 3.952a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-900 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-600 transition"
                      required
                      disabled={forgotLoading || forgotSuccess}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!forgotEmail.trim() || forgotLoading || forgotSuccess}
                      className={`w-full py-3 px-4 text-xs font-bold text-white rounded-xl transition shadow-lg relative overflow-hidden select-none active:scale-[0.98] ${
                        forgotEmail.trim() && !forgotLoading && !forgotSuccess
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-indigo-600/10 cursor-pointer"
                          : "bg-slate-900 border border-slate-800 shadow-none cursor-not-allowed opacity-60 text-slate-500"
                      }`}
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending link...
                        </span>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </div>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail("");
                      setForgotSuccess(false);
                      setError("");
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Interactive Tab Switcher */}
                <div className="flex bg-slate-950/60 rounded-xl p-1 mb-8 border border-slate-900">
                  <button
                    onClick={() => { setIsLogin(false); setError(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      !isLogin 
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => { setIsLogin(true); setError(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      isLogin 
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/10" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Log In
                  </button>
                </div>

                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {isLogin ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    {isLogin ? "Login to access your tracker panel" : "Start managing your balances and logs"}
                  </p>
                </div>

                {/* Error Message banner */}
                {error && (
                  <div className="mb-6 p-3.5 bg-rose-950/30 border border-rose-900/40 rounded-2xl text-rose-400 text-xs font-semibold flex items-start space-x-2 animate-shake">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Main Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                  
                  {/* Email */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.22a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                        <path d="m19 8.839-7.903 3.952a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-900 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-600 transition"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/50 border border-slate-900 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-600 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06L3.28 2.22Zm5.18 5.18 1.94 1.94a2.5 2.5 0 0 0 3.28 3.28l1.62 1.62a7.747 7.747 0 0 0 2.24-2.74.75.75 0 0 0 0-.5c-1.285-2.5-3.86-4.5-7.5-4.5a7.7 7.7 0 0 0-1.58.12ZM10 12.5a2.5 2.5 0 0 1-2.5-2.5c0-.18.019-.356.057-.527L5.358 7.27a7.747 7.747 0 0 0-2.898 2.23.75.75 0 0 0 0 .5c1.285 2.5 3.86 4.5 7.5 4.5a7.733 7.733 0 0 0 2.536-.427l-1.37-1.37c-.365.17-.768.297-1.166.297Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                          <path fillRule="evenodd" d="M.664 9.505a.75.75 0 0 0 0 .99c1.285 2.5 3.86 4.5 7.5 4.5s6.215-2 7.5-4.5a.75.75 0 0 0 0-.99C14.379 7.005 11.79 5 8 5S1.954 7.005.664 9.505ZM9 10a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {isLogin && (
                    <div className="flex justify-end px-0.5">
                      <button
                        id="forgot-password-link"
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError("");
                          setForgotSuccess(false);
                          setForgotEmail(email); // prefill with whatever was typed in login email field
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Password strength visual indicator (only shown during SignUp) */}
                  {!isLogin && password && (
                    <div className="space-y-1.5 px-0.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold uppercase">Strength</span>
                        <span className="font-semibold text-slate-300">{passwordStrength.label}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${passwordStrength.color}`}></div>
                      </div>
                    </div>
                  )}

                  {/* Confirm Password (only shown in Signup mode) */}
                  {!isLogin && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-900 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-600 transition"
                        required={!isLogin}
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isFormValid || loading}
                      className={`w-full py-3 px-4 text-xs font-bold text-white rounded-xl transition shadow-lg relative overflow-hidden select-none active:scale-[0.98] ${
                        isFormValid && !loading
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-indigo-600/10 cursor-pointer"
                          : "bg-slate-900 border border-slate-800 shadow-none cursor-not-allowed opacity-60 text-slate-500"
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying details...
                        </span>
                      ) : isLogin ? (
                        "Authorize Session"
                      ) : (
                        "Initialize Account"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Toggle Button in bottom container */}
          {!showForgotPassword && (
            <div className="bg-slate-950/20 border border-slate-900 rounded-2xl py-4 px-6 text-center text-xs">
              <span className="text-slate-500">
                {isLogin ? "Need a tracker account? " : "Already registered? "}
              </span>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-indigo-400 font-bold hover:text-indigo-300 underline focus:outline-none transition"
              >
                {isLogin ? "Create Account" : "Access Console"}
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-slate-900/50 text-[11px] text-slate-600 z-10">
        © {new Date().getFullYear()} FinFlow Payments Inc. Powered by Firebase. All rights reserved.
      </footer>
    </div>
  );
}
