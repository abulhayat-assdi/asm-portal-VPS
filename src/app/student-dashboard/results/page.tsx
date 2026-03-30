"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentResult, ExamResult } from "@/services/resultService";

const ShieldCheckIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
);
const DocumentTextIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
const CheckBadgeIcon = ({ className }: { className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
);

export default function StudentResultsPage() {
    const { userProfile, loading } = useAuth();
    const [result, setResult] = useState<ExamResult | null>(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchMyResult = async () => {
             if (userProfile?.studentBatchName && userProfile?.studentRoll) {
                try {
                    const data = await getStudentResult(userProfile.studentBatchName, userProfile.studentRoll);
                    setResult(data);
                } catch (err) {
                    console.error("Failed to fetch student result", err);
                } finally {
                    setFetching(false);
                }
             } else {
                 setFetching(false);
             }
        };

        if (!loading) {
            fetchMyResult();
        }
    }, [loading, userProfile]);

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Exam Results</h1>
                        <p className="text-[#6b7280] mt-1">
                            Check your final performance evaluation and graduation remarks.
                        </p>
                    </div>
                </div>
            </div>

            {!result || !result.marks ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-lg border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                     {/* Decorative Elements */}
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-50 rounded-full opacity-50 blur-2xl"></div>
                     <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gray-50 rounded-full opacity-50 blur-2xl"></div>
                     
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 relative z-10">
                        <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                     </div>
                     <h2 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">Results Pending</h2>
                     <p className="text-gray-500 max-w-md mx-auto relative z-10">
                         Your final exam results for Batch {userProfile?.studentBatchName} have not been published yet. Please check back later or contact your administration.
                     </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#059669]/20 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#059669] rounded-full opacity-5"></div>
                    <div className="absolute top-1/2 left-0 w-32 h-32 bg-[#059669] rounded-full opacity-5 blur-xl"></div>
                    
                    {/* Result Header */}
                    <div className="text-center pb-8 border-b border-gray-100 relative z-10">
                        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-4">
                             <CheckBadgeIcon className="w-12 h-12 text-[#059669]" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Final Evaluation</h2>
                        <p className="text-gray-500 mt-2 font-medium">Batch {result.batchName}</p>
                    </div>

                    {/* Result Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 relative z-10">
                        <div className="flex flex-col justify-center">
                             <div className="space-y-6">
                                 <div>
                                     <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-1">Student Name</p>
                                     <p className="text-xl font-bold text-gray-900">{result.name}</p>
                                 </div>
                                 <div className="h-px w-16 bg-gray-200"></div>
                                 <div>
                                     <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-1">Roll Number</p>
                                     <p className="text-xl font-bold text-gray-900"># {result.roll}</p>
                                 </div>
                             </div>
                        </div>

                        <div className="bg-emerald-50 rounded-2xl p-8 flex flex-col items-center justify-center border border-emerald-100 shadow-inner">
                             <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest mb-3">Total Marks Obtained</p>
                             <div className="text-6xl font-black text-[#059669] tracking-tighter shadow-sm">
                                 {result.marks}
                             </div>
                        </div>
                    </div>

                    {/* Remarks Section */}
                    {result.remarks && (
                        <div className="pt-8 border-t border-gray-100 relative z-10">
                            <div className="flex gap-4">
                                <div className="mt-1">
                                     <ShieldCheckIcon className="w-6 h-6 text-[#059669]" />
                                </div>
                                <div>
                                     <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-2">Evaluator Remarks</p>
                                     <p className="text-lg text-gray-800 italic font-medium leading-relaxed">&quot;{result.remarks}&quot;</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
