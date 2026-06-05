"use client";

import { useState } from "react";
import { Building2, Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed. Please try again.");
                setLoading(false);
                return;
            }

            // Verify this is the SaaS owner
            const verifyRes = await fetch("/api/saas/auth/verify");
            const verifyData = await verifyRes.json();

            if (!verifyData.isSaasOwner) {
                // Not the SaaS owner — log out and show error
                await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                setError("Access denied. This panel is for platform administrators only.");
                setLoading(false);
                return;
            }

            // Success — navigate to admin dashboard (hard redirect for fresh session)
            window.location.href = "/";
        } catch {
            setError("Connection error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/40">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Platform Admin</h1>
                    <p className="text-slate-400 text-sm mt-1">TASM SaaS Management</p>
                </div>

                {/* Card */}
                <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
                    <h2 className="text-white font-semibold text-lg mb-5">Sign in to continue</h2>

                    {error && (
                        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Restricted access — authorized personnel only
                </p>
            </div>
        </div>
    );
}
