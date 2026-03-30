"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTeachers, Teacher } from "@/services/teacherService";
import {
    uploadHomeworkFile,
    submitHomework,
    getHomeworkByStudent,
    formatHomeworkDate,
    HomeworkSubmission
} from "@/services/homeworkService";

export default function HomeworkSubmissionPage() {
    const { userProfile, loading: authLoading } = useAuth();

    // Teachers list
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);

    // Form state
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [subject, setSubject] = useState("");
    const [textContent, setTextContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // History
    const [mySubmissions, setMySubmissions] = useState<HomeworkSubmission[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const MAX_FILE_SIZE_MB = 10;

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await getAllTeachers();
                setTeachers(data);
            } catch (err) {
                console.error("Failed to load teachers:", err);
            } finally {
                setLoadingTeachers(false);
            }
        };
        fetchTeachers();
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            if (userProfile?.uid) {
                try {
                    const data = await getHomeworkByStudent(userProfile.uid);
                    setMySubmissions(data);
                } catch (err) {
                    console.error("Failed to load submissions:", err);
                } finally {
                    setLoadingHistory(false);
                }
            }
        };
        if (!authLoading && userProfile) {
            fetchHistory();
        }
    }, [userProfile, authLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                setSubmitError(`File size must be under ${MAX_FILE_SIZE_MB}MB`);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setSubmitError("");
            setSelectedFile(file);
        }
    };

    const resetForm = () => {
        setSelectedTeacher("");
        setSubject("");
        setTextContent("");
        setSelectedFile(null);
        setUploadProgress(0);
        setSubmitError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacher || !subject.trim()) {
            setSubmitError("Please select a teacher and enter a subject.");
            return;
        }
        if (!selectedFile && !textContent.trim()) {
            setSubmitError("Please upload a file or write your homework text.");
            return;
        }
        if (!userProfile) return;

        setIsSubmitting(true);
        setSubmitError("");
        setUploadProgress(0);

        try {
            let fileUrl: string | undefined;
            let storagePath: string | undefined;
            let fileName: string | undefined;

            // Upload file if present
            if (selectedFile) {
                const result = await uploadHomeworkFile(
                    selectedFile,
                    userProfile.studentBatchName || "unknown",
                    (progress) => setUploadProgress(progress)
                );
                fileUrl = result.fileUrl;
                storagePath = result.storagePath;
                fileName = result.fileName;
            }

            const now = new Date();

            await submitHomework({
                studentUid: userProfile.uid,
                studentName: userProfile.displayName || "Unknown",
                studentRoll: userProfile.studentRoll || "N/A",
                studentBatchName: userProfile.studentBatchName || "N/A",
                teacherName: selectedTeacher,
                subject: subject.trim(),
                fileUrl,
                storagePath,
                fileName,
                textContent: textContent.trim() || undefined,
                submissionDate: formatHomeworkDate(now),
            });

            setSubmitSuccess(true);
            resetForm();

            // Refresh history
            const updated = await getHomeworkByStudent(userProfile.uid);
            setMySubmissions(updated);

            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to submit homework:", err);
            setSubmitError("Failed to submit homework. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                <div>
                    <h1 className="text-3xl font-bold text-[#1f2937]">Homework Submission</h1>
                    <p className="text-[#6b7280] mt-1">Submit your homework to the respective teacher</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* ===== LEFT: Submission Form ===== */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Form Header with auto-filled student info */}
                        <div className="bg-gradient-to-r from-[#059669] to-[#10b981] p-5 text-white">
                            <h2 className="text-xl font-bold">Submit Homework</h2>
                            <p className="text-emerald-100 text-sm mt-0.5">আপনার হোমওয়ার্ক সাবমিট করুন</p>
                            <div className="mt-3 bg-white/20 rounded-xl px-4 py-2.5 text-sm space-y-0.5">
                                <p><span className="opacity-75">Name:</span> <strong>{userProfile?.displayName}</strong></p>
                                <p>
                                    <span className="opacity-75">Batch:</span> <strong>{userProfile?.studentBatchName || "N/A"}</strong>
                                    &nbsp;|&nbsp;
                                    <span className="opacity-75">Roll:</span> <strong>{userProfile?.studentRoll || "N/A"}</strong>
                                    &nbsp;|&nbsp;
                                    <span className="opacity-75">Date:</span> <strong>{formatHomeworkDate(new Date())}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Success State */}
                        {submitSuccess && (
                            <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="font-bold text-emerald-800 text-sm">Homework Submitted Successfully!</p>
                                    <p className="text-emerald-600 text-xs">Your teacher will review it soon.</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Teacher Select */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Teacher <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    required
                                    disabled={loadingTeachers}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all bg-white disabled:opacity-50"
                                >
                                    <option value="">
                                        {loadingTeachers ? "Loading teachers..." : "-- Select Teacher --"}
                                    </option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.name}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Subject / বিষয় <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Week 3 - Sales Funnel Assignment"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all"
                                />
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-3 text-gray-400 font-medium">Homework Content</span>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Upload File <span className="text-gray-400 font-normal">(Optional — Max {MAX_FILE_SIZE_MB}MB)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-xl transition-all"
                                    />
                                </div>
                                {selectedFile && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">{selectedFile.name}</span>
                                        <span className="text-gray-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                            className="ml-auto text-red-500 hover:text-red-700 font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                                {/* Upload Progress */}
                                {isSubmitting && selectedFile && uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-[#059669] h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
                                    </div>
                                )}
                            </div>

                            {/* Text Content */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Write Homework <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    placeholder="আপনার হোমওয়ার্ক এখানে লিখুন..."
                                    rows={5}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Error */}
                            {submitError && (
                                <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">{submitError}</p>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[#059669] text-white font-bold rounded-xl hover:bg-[#047857] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : (
                                    "Submit Homework"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ===== RIGHT: Submission History ===== */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                📋 My Submissions
                                {mySubmissions.length > 0 && (
                                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                                        {mySubmissions.length}
                                    </span>
                                )}
                            </h3>
                        </div>

                        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#059669]"></div>
                                </div>
                            ) : mySubmissions.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📭</div>
                                    <p className="text-gray-500 text-sm">No homework submitted yet.</p>
                                    <p className="text-gray-400 text-xs mt-1">Your submissions will appear here.</p>
                                </div>
                            ) : (
                                mySubmissions.map((hw) => (
                                    <div
                                        key={hw.id}
                                        className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{hw.subject}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <span className="font-medium text-emerald-700">To:</span> {hw.teacherName}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{hw.submissionDate}</span>
                                        </div>

                                        {hw.fileName && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                <a
                                                    href={hw.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline truncate"
                                                >
                                                    {hw.fileName}
                                                </a>
                                            </div>
                                        )}

                                        {hw.textContent && (
                                            <p className="mt-2 text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-100 line-clamp-3">
                                                {hw.textContent}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
