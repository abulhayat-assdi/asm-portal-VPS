"use client";

import { useState, useEffect } from "react";
import TeacherCard from "@/components/ui/TeacherCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getAllTeachers, addTeacher, updateTeacher, deleteTeacher, Teacher } from "@/services/teacherService";
import { useAuth } from "@/contexts/AuthContext";

// Portal owner email — only this account can grant/revoke admin access
const PORTAL_OWNER_EMAIL = "mohammadabulhayatt@gmail.com";

export default function TeachersPage() {
    const { user, userProfile } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Role checks
    const isAdminUser = userProfile?.role === "admin";
    const isPortalOwner = userProfile?.email?.toLowerCase() === PORTAL_OWNER_EMAIL.toLowerCase();

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    // Delete confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state — two email fields
    const [formData, setFormData] = useState({
        teacherId: "",
        name: "",
        designation: "",
        about: "",
        phone: "",
        email: "",        // display email (shown on portal & public page)
        loginEmail: "",   // login email (used for Firebase Auth)
        password: "",
        profileImageUrl: "",
        isAdmin: false,
        order: 0,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const data = await getAllTeachers();
            setTeachers(data);
        } catch (error) {
            console.error("Failed to load teachers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({
            teacherId: "",
            name: "",
            designation: "",
            about: "",
            phone: "",
            email: "",
            loginEmail: "",
            password: "",
            profileImageUrl: "",
            isAdmin: false,
            order: 0,
        });
        setSelectedFile(null);
        setImagePreview(null);
        setEditingTeacher(null);
        setIsEditMode(false);
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Open Add Modal — only admin can add
    const openAddModal = () => {
        if (!isAdminUser) {
            alert("Only admins can add teachers.");
            return;
        }
        resetForm();
        setIsModalOpen(true);
    };

    // Open Edit Modal — only admin can edit
    const openEditModal = (teacher: Teacher) => {
        if (!isAdminUser) {
            alert("Only admins can edit teachers.");
            return;
        }
        setEditingTeacher(teacher);
        setFormData({
            teacherId: teacher.teacherId,
            name: teacher.name,
            designation: teacher.designation,
            about: teacher.about || "",
            phone: teacher.phone,
            email: teacher.email,
            loginEmail: teacher.loginEmail || teacher.email, // fallback for old records
            password: "", // intentionally blank for edit
            profileImageUrl: teacher.profileImageUrl || "",
            isAdmin: Boolean(teacher.isAdmin),
            order: teacher.order || 0,
        });
        setImagePreview(teacher.profileImageUrl || null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Open Delete Modal
    const openDeleteModal = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setIsDeleteModalOpen(true);
    };

    // Handle Add/Edit Teacher Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in.");
            return;
        }

        if (!isAdminUser) {
            alert("Only admins can manage teachers.");
            return;
        }

        // Validate: if isAdmin is being granted, must be portal owner
        if (formData.isAdmin && !isPortalOwner) {
            // If editing and isAdmin was already true (no change), it's OK
            const wasAlreadyAdmin = isEditMode && editingTeacher?.isAdmin === true;
            if (!wasAlreadyAdmin) {
                alert("Only the portal owner (Abul Hayat) can grant admin access.");
                setFormData(prev => ({ ...prev, isAdmin: false }));
                return;
            }
        }

        // Validate: if revoking admin, must be portal owner
        if (isEditMode && editingTeacher?.isAdmin === true && !formData.isAdmin && !isPortalOwner) {
            alert("Only the portal owner (Abul Hayat) can revoke admin access.");
            setFormData(prev => ({ ...prev, isAdmin: true }));
            return;
        }

        setIsSubmitting(true);
        try {
            let finalImageUrl = formData.profileImageUrl;

            // 1. Upload image if selected
            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("file", selectedFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload image.");
                }

                const uploadData = await uploadRes.json();
                finalImageUrl = uploadData.url;
            }

            if (isEditMode && editingTeacher) {
                // --- EDIT MODE ---

                // Get fresh token for admin API calls
                const freshToken = user ? await user.getIdToken(true) : "";
                document.cookie = `__session=${freshToken}; path=/; max-age=86400; SameSite=Lax`;

                const oldLoginEmail = editingTeacher.loginEmail || editingTeacher.email;
                const newLoginEmail = formData.loginEmail;
                const adminChanged = formData.isAdmin !== Boolean(editingTeacher.isAdmin);
                const loginEmailChanged = newLoginEmail !== oldLoginEmail;

                // If login email or admin status changed, call server-side API
                if (loginEmailChanged || adminChanged) {
                    const updateBody: any = { firestoreDocId: editingTeacher.id };
                    if (loginEmailChanged) updateBody.newLoginEmail = newLoginEmail;
                    if (adminChanged) updateBody.isAdmin = formData.isAdmin;

                    const res = await fetch("/api/admin/update-teacher", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${freshToken}`,
                        },
                        body: JSON.stringify(updateBody),
                    });

                    const result = await res.json();
                    if (!res.ok) {
                        throw new Error(result.error || "Failed to update teacher auth/role.");
                    }
                }

                // Always update Firestore teacher doc directly
                await updateTeacher(editingTeacher.id, {
                    teacherId: formData.teacherId,
                    name: formData.name,
                    designation: formData.designation,
                    about: formData.about,
                    phone: formData.phone,
                    email: formData.email,           // display email
                    loginEmail: formData.loginEmail, // login email
                    profileImageUrl: finalImageUrl || undefined,
                    isAdmin: formData.isAdmin,
                    order: Number(formData.order),
                });
            } else {
                // --- ADD MODE ---

                // Get fresh token
                let freshToken = "";
                if (user) {
                    freshToken = await user.getIdToken(true);
                    document.cookie = `__session=${freshToken}; path=/; max-age=86400; SameSite=Lax`;
                }

                // Create Firebase Auth user via secure backend (uses loginEmail)
                const response = await fetch("/api/admin/create-teacher", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${freshToken}`,
                    },
                    body: JSON.stringify({
                        loginEmail: formData.loginEmail,
                        displayEmail: formData.email,
                        password: formData.password,
                        name: formData.name,
                        phone: formData.phone,
                        isAdmin: formData.isAdmin,
                        order: Number(formData.order),
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || result.message || "Failed to create teacher account.");
                }

                // Add to teachers collection
                await addTeacher({
                    teacherId: formData.teacherId,
                    name: formData.name,
                    designation: formData.designation,
                    about: formData.about,
                    phone: formData.phone,
                    email: formData.email,         // display email
                    loginEmail: formData.loginEmail, // login email
                    profileImageUrl: finalImageUrl || undefined,
                    isAdmin: formData.isAdmin,
                    order: Number(formData.order),
                });
            }

            await fetchTeachers();
            setIsModalOpen(false);
            resetForm();
        } catch (error: any) {
            console.error("Failed to save teacher", error);
            alert(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete Teacher
    const handleDelete = async () => {
        if (!teacherToDelete) return;

        setIsDeleting(true);
        try {
            await deleteTeacher(teacherToDelete.id);
            await fetchTeachers();
            setIsDeleteModalOpen(false);
            setTeacherToDelete(null);
        } catch (error) {
            console.error("Failed to delete teacher", error);
            alert("Failed to delete teacher. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter teachers based on search query
    const filteredTeachers = teachers.filter(teacher => {
        const query = searchQuery.toLowerCase();
        return (
            teacher.name.toLowerCase().includes(query) ||
            teacher.teacherId.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            Teacher Directory
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            View all teachers and their information
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="default" size="lg">
                        {loading ? "..." : `${filteredTeachers.length} Teachers`}
                    </Badge>
                    {isAdminUser && (
                        <button
                            onClick={openAddModal}
                            className="px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors inline-flex items-center gap-2"
                        >
                            <span className="text-lg">+</span>
                            Add Teacher
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Search by name or ID (e.g. ID-101)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-3 border border-[#e5e7eb] rounded-lg bg-white text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent"
                />
                {searchQuery && (
                    <Button
                        variant="secondary"
                        onClick={() => setSearchQuery("")}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Teachers Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
                    <p className="mt-4 text-[#6b7280]">Loading teachers...</p>
                </div>
            ) : filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher) => {
                        const canEdit = isAdminUser;
                        const canDelete = isAdminUser;

                        return (
                            <TeacherCard
                                key={teacher.id}
                                teacher={teacher}
                                onEdit={canEdit ? openEditModal : undefined}
                                onDelete={canDelete ? openDeleteModal : undefined}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-[#6b7280] text-lg">
                        {teachers.length === 0
                            ? "No teachers found in the directory."
                            : `No teachers found matching "${searchQuery}"`}
                    </p>
                </div>
            )}

            {/* Add/Edit Teacher Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#1f2937]">
                                {isEditMode ? 'Edit Teacher' : 'Add Teacher'}
                            </h2>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-[#6b7280] hover:text-[#1f2937]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                        Teacher ID *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.teacherId}
                                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                        placeholder="e.g., ID-101"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Abul Hayat"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Designation *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    placeholder="e.g., Course Coordinator"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    About / Bio
                                </label>
                                <textarea
                                    value={formData.about}
                                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                    placeholder="Short bio or description..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g., 01712345678"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                />
                            </div>

                            {/* TWO EMAIL FIELDS */}
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-3">
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                    Email Configuration
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                        🔐 Login Email *
                                        <span className="ml-1 text-xs font-normal text-gray-500">(used to sign in to the portal)</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.loginEmail}
                                        onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                                        placeholder="e.g., teacher.login@gmail.com"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                        📧 Display Email *
                                        <span className="ml-1 text-xs font-normal text-gray-500">(shown on portal & public page)</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="e.g., teacher@example.com"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    />
                                </div>
                            </div>

                            {!isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                        Password * (for teacher login)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Secure password (min 6 chars)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                        Serial Number (Order) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g., 1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                                    />
                                </div>

                                <div className="flex items-end pb-1">
                                    {isPortalOwner ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isAdmin"
                                                checked={formData.isAdmin}
                                                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                                className="w-4 h-4 text-[#059669] border-gray-300 rounded focus:ring-[#059669]"
                                            />
                                            <label htmlFor="isAdmin" className="text-sm font-medium text-[#1f2937]">
                                                Grant Admin Access
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 opacity-50 cursor-not-allowed" title="Only the portal owner can grant admin access">
                                            <input
                                                type="checkbox"
                                                id="isAdmin"
                                                checked={formData.isAdmin}
                                                disabled
                                                className="w-4 h-4 text-gray-300 border-gray-300 rounded"
                                            />
                                            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-400">
                                                Grant Admin Access
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isPortalOwner && (
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                    ⚠️ Only the portal owner can grant or revoke admin access.
                                </p>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[#1f2937] mb-1">
                                    Profile Image
                                </label>
                                <div className="flex items-center gap-4">
                                    {imagePreview && (
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#059669] flex-shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#059669] file:text-white hover:file:bg-[#10b981]"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave blank to keep existing image (if editing) or use default.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#10b981] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : (isEditMode ? "Update Teacher" : "Add Teacher")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && teacherToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Teacher</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete <strong>{teacherToDelete.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setIsDeleteModalOpen(false); setTeacherToDelete(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
