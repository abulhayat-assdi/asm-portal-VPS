"use client";

import { useState, useEffect, useCallback } from "react";
import AdminRoute from "@/components/auth/AdminRoute";

interface UserRecord {
    id: string;
    email: string;
    displayName: string;
    role: string;
    teacherId?: string;
    studentBatchName?: string;
    studentRoll?: string;
    lastLoginAt?: string;
    createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
    admin:   "bg-purple-100 text-purple-700",
    teacher: "bg-blue-100 text-blue-700",
    student: "bg-green-100 text-green-700",
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Password reset modal
    const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (
            u.email.toLowerCase().includes(q) ||
            u.displayName?.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q) ||
            (u.studentBatchName || "").toLowerCase().includes(q) ||
            (u.studentRoll || "").toLowerCase().includes(q)
        );
    });

    const openResetModal = (user: UserRecord) => {
        setResetTarget(user);
        setNewPassword("");
        setConfirmPassword("");
        setResetMessage(null);
    };

    const closeModal = () => {
        setResetTarget(null);
        setNewPassword("");
        setConfirmPassword("");
        setResetMessage(null);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetTarget) return;

        if (newPassword.length < 6) {
            setResetMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setResetMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        setIsResetting(true);
        setResetMessage(null);
        try {
            const res = await fetch("/api/admin/set-user-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: resetTarget.id, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setResetMessage({ type: "error", text: data.error || "Failed to reset password." });
            } else {
                setResetMessage({ type: "success", text: `Password updated for ${resetTarget.email}` });
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(closeModal, 2000);
            }
        } catch {
            setResetMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setIsResetting(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Never";
        return new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <AdminRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-10 bg-[#059669] rounded-full" />
                        <div>
                            <h1 className="text-2xl font-bold text-[#1f2937]">User Management</h1>
                            <p className="text-sm text-[#6b7280]">View all users and reset passwords directly</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600">
                        {loading ? "..." : `${users.length} Users`}
                    </div>
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search by email, name, batch, roll..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#059669]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No users found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Name / Email</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch / Roll</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Login</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{user.displayName || "—"}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role] || "bg-gray-100 text-gray-600"}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">
                                                {user.studentBatchName
                                                    ? <><span className="font-medium">{user.studentBatchName}</span><br />Roll: {user.studentRoll || "—"}</>
                                                    : user.teacherId || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {formatDate(user.lastLoginAt)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => openResetModal(user)}
                                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                                                >
                                                    Reset Password
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Setting new password for: <strong className="text-gray-800">{resetTarget.email}</strong>
                        </p>

                        {resetMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                                resetMessage.type === "success"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {resetMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setResetMessage(null); }}
                                    placeholder="Minimum 6 characters"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setResetMessage(null); }}
                                    placeholder="Re-enter new password"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetting}
                                    className="flex-1 py-2.5 bg-[#059669] text-white font-semibold rounded-lg text-sm hover:bg-[#047857] disabled:opacity-50"
                                >
                                    {isResetting ? "Saving..." : "Set Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminRoute>
    );
}
