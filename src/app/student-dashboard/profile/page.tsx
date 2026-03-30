"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBatchInfo, StudentBatchInfo } from "@/services/batchInfoService";
import { submitUpdateRequest } from "@/services/studentUpdateService";

export default function StudentProfilePage() {
    const { userProfile, loading } = useAuth();
    const [studentData, setStudentData] = useState<StudentBatchInfo | null>(null);
    const [fetching, setFetching] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        phone: "",
        dob: "",
        educationalDegree: "",
        category: "",
        bloodGroup: "",
        address: "",
        courseStatus: "",
        currentlyDoing: "",
        companyName: "",
        businessName: "",
        salary: "",
    });

    useEffect(() => {
        const fetchMyData = async () => {
            if (userProfile?.studentBatchName && userProfile?.studentRoll) {
                try {
                    const allData = await getAllBatchInfo();
                    const match = allData.find(
                        d => d.batchName === userProfile.studentBatchName && d.roll === userProfile.studentRoll
                    );
                    if (match) {
                        setStudentData(match);
                        setForm({
                            phone: match.phone || "",
                            dob: match.dob || "",
                            educationalDegree: match.educationalDegree || "",
                            category: match.category || "",
                            bloodGroup: match.bloodGroup || "",
                            address: match.address || "",
                            courseStatus: match.courseStatus || "",
                            currentlyDoing: match.currentlyDoing || "",
                            companyName: match.companyName || "",
                            businessName: match.businessName || "",
                            salary: match.salary ? String(match.salary) : "",
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch profile data:", err);
                } finally {
                    setFetching(false);
                }
            } else {
                setFetching(false);
            }
        };
        if (!loading) fetchMyData();
    }, [userProfile, loading]);

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            // Find only changed fields
            const proposedChanges: Record<string, string> = {};
            if (form.phone !== (studentData?.phone || "")) proposedChanges.phone = form.phone;
            if (form.dob !== (studentData?.dob || "")) proposedChanges.dob = form.dob;
            if (form.educationalDegree !== (studentData?.educationalDegree || "")) proposedChanges.educationalDegree = form.educationalDegree;
            if (form.category !== (studentData?.category || "")) proposedChanges.category = form.category;
            if (form.bloodGroup !== (studentData?.bloodGroup || "")) proposedChanges.bloodGroup = form.bloodGroup;
            if (form.address !== (studentData?.address || "")) proposedChanges.address = form.address;
            if (form.courseStatus !== (studentData?.courseStatus || "")) proposedChanges.courseStatus = form.courseStatus;
            if (form.currentlyDoing !== (studentData?.currentlyDoing || "")) proposedChanges.currentlyDoing = form.currentlyDoing;
            if (form.companyName !== (studentData?.companyName || "")) proposedChanges.companyName = form.companyName;
            if (form.businessName !== (studentData?.businessName || "")) proposedChanges.businessName = form.businessName;
            if (form.salary !== (studentData?.salary ? String(studentData.salary) : "")) proposedChanges.salary = form.salary;

            if (Object.keys(proposedChanges).length === 0) {
                setError("No changes detected. Please modify at least one field before submitting.");
                setSubmitting(false);
                return;
            }

            await submitUpdateRequest(
                userProfile!.uid,
                userProfile!.displayName,
                userProfile!.studentBatchName!,
                userProfile!.studentRoll!,
                proposedChanges,
                {
                    phone: studentData?.phone,
                    dob: studentData?.dob,
                    educationalDegree: studentData?.educationalDegree,
                    category: studentData?.category,
                    bloodGroup: studentData?.bloodGroup,
                    address: studentData?.address,
                    courseStatus: studentData?.courseStatus,
                    currentlyDoing: studentData?.currentlyDoing,
                    companyName: studentData?.companyName,
                    businessName: studentData?.businessName,
                    salary: studentData?.salary,
                }
            );

            setSubmitted(true);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || "Failed to submit update request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    const displayField = (label: string, value: React.ReactNode | string | number | undefined | null) => (
        <div key={label}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-base font-semibold text-gray-800">{value || <span className="text-gray-300 font-normal italic">Not set</span>}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">My Profile</h1>
                    <p className="text-[#6b7280] mt-1">View your batch information and submit update requests.</p>
                </div>
            </div>

            {/* Profile Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5278] p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-black shadow-inner">
                            {userProfile?.displayName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{userProfile?.displayName}</h2>
                            <p className="text-blue-200 text-sm mt-0.5">{userProfile?.email}</p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest">Batch</p>
                        <p className="text-xl font-bold text-white mt-0.5">{userProfile?.studentBatchName}</p>
                        <p className="text-blue-200 text-sm">Roll: {userProfile?.studentRoll}</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {displayField("Phone", studentData?.phone)}
                    {displayField("Date of Birth", studentData?.dob)}
                    {displayField("Educational Degree", studentData?.educationalDegree)}
                    {displayField("Category", studentData?.category)}
                    {displayField("Blood Group", studentData?.bloodGroup ? <span className="text-red-600 font-bold">{studentData.bloodGroup}</span> : null)}
                    {displayField("Address", studentData?.address)}
                    {displayField("Course Status", studentData?.courseStatus)}
                    {displayField("Currently Doing", studentData?.currentlyDoing === 'Nothing' ? 'Studying Further' : studentData?.currentlyDoing)}
                    {displayField("Company Name", studentData?.companyName)}
                    {displayField("Business Name", studentData?.businessName)}
                    {displayField("Monthly Salary", studentData?.salary ? `৳ ${Number(studentData.salary).toLocaleString()}` : undefined)}
                </div>
            </div>

            {/* Success Notice */}
            {submitted && (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-800">Update Request Submitted!</h3>
                        <p className="text-emerald-700 text-sm mt-1">
                            Your update request has been sent to the admin for review. Once approved, your batch information will be automatically updated.
                        </p>
                    </div>
                </div>
            )}

            {/* Edit Request Section */}
            {!submitted && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Request Profile Update</h3>
                            <p className="text-sm text-gray-500 mt-1">Changes require admin approval before being reflected in your batch data.</p>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#059669] text-white text-sm font-bold rounded-xl hover:bg-[#047857] transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Information
                            </button>
                        )}
                    </div>

                    {isEditing && (
                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={e => handleChange("phone", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={form.dob}
                                        onChange={e => handleChange("dob", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Educational Degree</label>
                                    <input
                                        type="text"
                                        value={form.educationalDegree}
                                        onChange={e => handleChange("educationalDegree", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                        placeholder="e.g. HSC, BBA, BSc in CS"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => handleChange("category", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                    >
                                        <option value="">Select option</option>
                                        <option value="Alim">Alim</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Blood Group</label>
                                    <select
                                        value={form.bloodGroup}
                                        onChange={e => handleChange("bloodGroup", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all font-semibold text-red-600"
                                    >
                                        <option value="">Select blood group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={e => handleChange("address", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                        placeholder="Your current address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Status</label>
                                    <select
                                        value={form.courseStatus}
                                        onChange={e => handleChange("courseStatus", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                    >
                                        <option value="">Select status</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Incomplete">Incomplete</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currently Doing</label>
                                    <select
                                        value={form.currentlyDoing}
                                        onChange={e => handleChange("currentlyDoing", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                    >
                                        <option value="">Select option</option>
                                        <option value="Job">Job</option>
                                        <option value="Business">Business</option>
                                        <option value="Studying Further">Studying Further</option>
                                        <option value="Nothing">Nothing yet</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                                    <input
                                        type="text"
                                        value={form.companyName}
                                        onChange={e => handleChange("companyName", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                        placeholder="Where you work"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                                    <input
                                        type="text"
                                        value={form.businessName}
                                        onChange={e => handleChange("businessName", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                        placeholder="Your business name (if any)"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly Salary (৳)</label>
                                    <input
                                        type="number"
                                        value={form.salary}
                                        onChange={e => handleChange("salary", e.target.value)}
                                        className="block w-full py-2.5 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] outline-none text-sm transition-all"
                                        placeholder="e.g. 25000"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`px-6 py-3 text-white font-bold text-sm rounded-xl shadow-sm transition-all ${
                                        submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#059669] hover:bg-[#047857]"
                                    }`}
                                >
                                    {submitting ? "Submitting..." : "Submit Update Request"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setError(""); }}
                                    className="px-6 py-3 text-gray-600 bg-gray-100 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
