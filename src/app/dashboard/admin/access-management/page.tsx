"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    PERMISSION_META,
    PERMISSION_GROUPS,
    PermissionKey,
    DEFAULT_TEACHER_PERMISSIONS,
    DEFAULT_ADMIN_PERMISSIONS,
    TEACHER_FEATURE_PERMISSIONS,
    PORTAL_OWNER_EMAIL,
} from "@/lib/permissions";

interface ManagedUser {
    id: string;
    email: string;
    displayName: string;
    role: string;
    isPortalOwner: boolean;
    permissions: string[];
}

const ROLE_BADGE: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 border border-purple-200",
    admin:       "bg-blue-100   text-blue-700   border border-blue-200",
    teacher:     "bg-green-100  text-green-700  border border-green-200",
};

const ROLE_LABEL: Record<string, string> = {
    super_admin: "Super Admin",
    admin:       "Admin",
    teacher:     "Teacher",
};

export default function AccessManagementPage() {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [editPerms, setEditPerms] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const isSuperAdmin = userProfile?.role === "super_admin";

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/access-management");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const openUser = (u: ManagedUser) => {
        setSelectedUser(u);
        setEditPerms(new Set(u.permissions));
    };

    const togglePermission = (key: PermissionKey) => {
        setEditPerms(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const applyPreset = (preset: "teacher" | "admin" | "admin_with_teacher" | "none") => {
        if (preset === "none") { setEditPerms(new Set()); return; }
        if (preset === "teacher") { setEditPerms(new Set(DEFAULT_TEACHER_PERMISSIONS)); return; }
        if (preset === "admin") { setEditPerms(new Set(DEFAULT_ADMIN_PERMISSIONS)); return; }
        if (preset === "admin_with_teacher") {
            setEditPerms(new Set([...DEFAULT_ADMIN_PERMISSIONS, ...TEACHER_FEATURE_PERMISSIONS]));
        }
    };

    const savePermissions = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/access-management", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUser.id, permissions: Array.from(editPerms) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save.");
            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, permissions: data.permissions } : u
            ));
            setSelectedUser(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to save permissions.");
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
                    <p className="text-gray-500">Only the portal owner (Super Admin) can manage access permissions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-10 bg-purple-600 rounded-full" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
                    <p className="text-gray-500 mt-1">Control which pages and features each user can access</p>
                </div>
            </div>

            {/* Portal Owner Notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl">👑</span>
                <div>
                    <p className="font-semibold text-purple-800">Portal Owner Protection</p>
                    <p className="text-sm text-purple-600 mt-0.5">
                        <strong>Abul Hayat</strong> ({PORTAL_OWNER_EMAIL}) is the permanent Super Admin.
                        Their account cannot be deleted, demoted, or have permissions restricted.
                        Only they can promote others to Super Admin.
                    </p>
                </div>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
            />

            {/* User List */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
                    <p className="mt-3 text-gray-500">Loading users...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(u => (
                        <div
                            key={u.id}
                            onClick={() => !u.isPortalOwner && openUser(u)}
                            className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                                u.isPortalOwner
                                    ? "border-purple-200 cursor-default opacity-80"
                                    : "border-gray-200 cursor-pointer hover:shadow-md hover:border-purple-300"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{u.displayName}</span>
                                        {u.isPortalOwner && <span className="text-yellow-500">👑</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate max-w-[180px]">{u.email}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_BADGE[u.role] || "bg-gray-100 text-gray-600"}`}>
                                    {ROLE_LABEL[u.role] || u.role}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {u.isPortalOwner ? "All permissions (permanent)" : `${u.permissions.length} permissions`}
                                </span>
                                {!u.isPortalOwner && (
                                    <span className="text-xs font-medium text-purple-600 hover:underline">
                                        Edit Access →
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Edit Access: {selectedUser.displayName}
                                </h2>
                                <p className="text-sm text-gray-500 mt-0.5">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Preset Buttons */}
                        <div className="px-6 pt-4 pb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Presets</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => applyPreset("teacher")} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium">
                                    Teacher Defaults
                                </button>
                                <button onClick={() => applyPreset("admin")} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium">
                                    Admin Only
                                </button>
                                <button onClick={() => applyPreset("admin_with_teacher")} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-medium">
                                    Admin + Teacher
                                </button>
                                <button onClick={() => applyPreset("none")} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium">
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Permission Groups */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                            {PERMISSION_GROUPS.map(group => {
                                const groupKeys = (Object.keys(PERMISSION_META) as PermissionKey[])
                                    .filter(k => PERMISSION_META[k].group === group.key);
                                if (groupKeys.length === 0) return null;
                                if (group.key === "system" && selectedUser.role !== "super_admin") {
                                    // access_management only shown if user is already super_admin or admin
                                    if (selectedUser.role !== "admin") return null;
                                }
                                return (
                                    <div key={group.key}>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                                            {group.label}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {groupKeys.map(key => {
                                                const meta = PERMISSION_META[key];
                                                const checked = editPerms.has(key);
                                                return (
                                                    <label
                                                        key={key}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                            checked
                                                                ? "bg-green-50 border-green-300"
                                                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => togglePermission(key)}
                                                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                                        />
                                                        <span className="text-lg">{meta.icon}</span>
                                                        <span className={`text-sm font-medium ${checked ? "text-green-800" : "text-gray-600"}`}>
                                                            {meta.label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                {editPerms.size} permission{editPerms.size !== 1 ? "s" : ""} selected
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={savePermissions}
                                    disabled={saving}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Access"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
