import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Mail, Lock, LogIn, UserPlus, Info } from "lucide-react";
import { UserProfile } from "../types";
import { DEFAULT_USER, DEFAULT_ADMIN } from "../lib/storage";
// @ts-ignore
import { supabase } from "../supabaseClient";

interface AuthPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Lahore");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (isLogin) {
      if (!email || !password) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (sbError) {
          setError(sbError.message);
          setLoading(false);
          return;
        }

        const userObj = data.user;
        const metadata = userObj?.user_metadata || {};
        const isAdmin = email.toLowerCase() === "admin@yarana.pk";

        onLoginSuccess({
          name: metadata.name || email.split("@")[0].split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") || "Yarana Member",
          email: email,
          phone: metadata.phone || "0300-1234567",
          city: metadata.city || "Lahore",
          avatar: metadata.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
          walletBalance: 0,
          isAdmin: isAdmin,
        });
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during sign in.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !email || !password || !phone) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: sbError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              city,
            },
          },
        });

        if (sbError) {
          setError(sbError.message);
          setLoading(false);
          return;
        }

        // Check if session is null (means email verification is enabled)
        if (!data.session) {
          setSuccessMessage("Check your email and confirm your account before logging in.");
          setLoading(false);
          return;
        }

        onLoginSuccess({
          name: name,
          email: email,
          phone: phone,
          city: city as any,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
          walletBalance: 0,
          isAdmin: false,
        });
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during registration.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (sbError) {
        setError(sbError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during Google sign in.");
      setLoading(false);
    }
  };

  const fillTestCredentials = (isAdminAcc: boolean) => {
    if (isAdminAcc) {
      setEmail("admin@yarana.pk");
      setPassword("admin123");
      setIsLogin(true);
    } else {
      setEmail("user@yarana.pk");
      setPassword("user123");
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2D2D2D] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[200px] h-[200px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white border border-[#E5E1D8] p-8 rounded-3xl shadow-md relative z-10"
        id="auth-container"
      >
        {/* Title / Logo */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full bg-[#FFF4E5] border border-[#FFE0B2] mb-4 text-[#E65100] shadow-sm">
            <Sparkles className="w-8 h-8 animate-pulse text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Yarana<span className="text-[#D4AF37]">.pk</span>
          </h2>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            {isLogin ? "Sign in to connect with high-quality companionship services in Pakistan." : "Join Pakistan's premier safety-first companionship network."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold" id="auth-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold" id="auth-success">
            {successMessage}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} id="auth-form">
          {!isLogin && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 px-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. Ali Khan"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 px-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 px-3 text-gray-700 text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                  placeholder="name@example.com"
                  id="input-auth-email"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <span className="text-[10px] text-[#D4AF37] hover:underline cursor-pointer font-bold">Forgot?</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F3F0E9]/30 border border-[#E5E1D8] rounded-xl py-2.5 pl-10 pr-3 text-gray-800 text-xs focus:outline-none focus:border-[#D4AF37]"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  id="input-auth-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black font-semibold uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-6 text-xs"
            id="btn-auth-submit"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#E5E1D8]/60"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase font-mono tracking-wider">or continue with</span>
          <div className="flex-grow border-t border-[#E5E1D8]/60"></div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 bg-white hover:bg-gray-50 border border-[#E5E1D8] text-gray-700 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm text-xs font-bold uppercase tracking-wider"
          id="btn-google-signin"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.54 0 2.92.53 4.01 1.58l3-3C17.18 1.84 14.81 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.01 7.15 8.79 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.58l3.76 2.92c2.2-2.03 3.49-5.02 3.49-8.74z"
            />
            <path
              fill="#FBBC05"
              d="M5.1 14.7c-.25-.76-.39-1.57-.39-2.4s.14-1.64.39-2.4L1.5 7.1C.54 9.03 0 11.22 0 12.5s.54 3.47 1.5 5.4l3.6-2.8z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.92c-1.1.74-2.51 1.18-4.2 1.18-3.21 0-5.99-2.11-6.9-5.26l-3.6 2.8C3.4 20.35 7.35 23 12 23z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Form Toggle */}
        <p className="text-center text-xs text-gray-500 mt-6">
          {isLogin ? "New to Yarana.pk? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMessage("");
            }}
            className="text-[#D4AF37] hover:underline font-bold cursor-pointer"
          >
            {isLogin ? "Register now" : "Login here"}
          </button>
        </p>

        {/* Quick Credentials Sandbox Assist */}
        <div className="mt-6 pt-5 border-t border-[#E5E1D8]/60 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 mb-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
            <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sandbox Test Accounts:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => fillTestCredentials(false)}
              className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[9px] text-center truncate cursor-pointer transition-all border border-[#E5E1D8]/40"
            >
              Client Account
            </button>
            <button
              onClick={() => fillTestCredentials(true)}
              className="px-3 py-2 rounded-xl bg-[#FFF4E5] hover:bg-[#FFE0B2] text-[#E65100] font-mono text-[9px] text-center truncate cursor-pointer transition-all border border-[#FFE0B2]"
            >
              Admin Account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
