"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth";
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [department, setDepartment] = useState("Administration");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter a valid work email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
          department: department.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Registration failed. Please check your details.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Account created successfully! Redirecting to dashboard...");

      // Automatically sign in
      const loginRes = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 700);
    } catch {
      setError("An unexpected network error occurred. Please verify your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/30 dark:bg-slate-950 font-sans select-none p-4 sm:p-8 relative">
      <div className="w-full max-w-lg space-y-6 relative z-10 my-auto">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.webp"
              alt="Mediyaz ART Bank"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Administrator Sign Up
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create an administrative or clinical staff management account
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
          {error && (
            <div className="p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Legal Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  placeholder="e.g. Dr. Ayesha Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63]"
                  disabled={loading || success}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder="admin.name@mediyaz.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63]"
                  disabled={loading || success}
                  required
                />
              </div>
            </div>

            {/* Role & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Role
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setRole(r);
                    if (r === "ADMIN") setDepartment("Administration");
                    else if (r === "MANAGER") setDepartment("Operations");
                    else setDepartment("Clinical Services");
                  }}
                  className="w-full h-11 px-3 text-xs bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#285b63] font-semibold text-slate-800 dark:text-slate-200"
                  disabled={loading || success}
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="MANAGER">Operations Manager</option>
                  <option value="EMPLOYEE">Clinical Staff Member</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    placeholder="e.g. Administration"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl h-11 text-xs"
                    disabled={loading || success}
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl h-11 text-xs"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Security Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 rounded-xl h-11 text-xs"
                  disabled={loading || success}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 rounded-xl h-11 text-xs"
                  disabled={loading || success}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full rounded-xl font-bold text-xs h-11 flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer mt-2 ${
                success
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-[#285b63] hover:bg-[#1d464d] text-white shadow-teal-900/20 active:scale-[0.99]"
              }`}
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account & Authorizing...</span>
                </>
              ) : success ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Registered! Redirecting to Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Notice */}
          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Already registered with administrative credentials?{" "}
              <Link href="/login" className="font-semibold text-[#285b63] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400">
          Super Administrator authority is managed centrally and cannot be registered publicly.
        </p>
      </div>
    </div>
  );
}
