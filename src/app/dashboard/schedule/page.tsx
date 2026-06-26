"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { getBatchClassCounts, getBatches, BatchItem } from "@/services/scheduleService";
import { getRoutineByBatch, BatchRoutine, uploadRoutineImage } from "@/services/routinesService";
import ImageLightbox from "@/components/ui/ImageLightbox";

export default function SchedulePage() {
    const { loading: authLoading, hasPermission } = useAuth();

    const [selectedRoutineBatch, setSelectedRoutineBatch] = useState("");
    const [routines, setRoutines] = useState<Record<string, BatchRoutine | null>>({});
    const [routineImageLoading, setRoutineImageLoading] = useState(false);
    const [availableRoutineBatches, setAvailableRoutineBatches] = useState<string[]>([]);
    const [batchStats, setBatchStats] = useState<Record<string, { subjectName: string; classCount: number }[]>>({});
    const [batchStatsLoading, setBatchStatsLoading] = useState(true);
    const [uploadingRoutine, setUploadingRoutine] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canManageRoutine = hasPermission("routine");

    useEffect(() => {
        getBatches()
            .then((batches: BatchItem[]) => {
                const activeBatchNames = batches.filter((b) => b.status === "active").map((b) => b.name).sort();
                setAvailableRoutineBatches(activeBatchNames);
                if (activeBatchNames.length > 0 && !selectedRoutineBatch) {
                    setSelectedRoutineBatch(activeBatchNames[activeBatchNames.length - 1]);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const fetchBatchStats = async () => {
            setBatchStatsLoading(true);
            try {
                setBatchStats(await getBatchClassCounts());
            } catch (error) {
                console.error("Failed to fetch batch stats", error);
            } finally {
                setBatchStatsLoading(false);
            }
        };

        fetchBatchStats();
    }, []);

    // Fetch all active batch routines in parallel
    useEffect(() => {
        if (availableRoutineBatches.length === 0) return;

        const loadAllRoutines = async () => {
            setRoutineImageLoading(true);
            const results: Record<string, BatchRoutine | null> = {};
            await Promise.all(
                availableRoutineBatches.map(async (batchName) => {
                    try {
                        const r = await getRoutineByBatch(batchName);
                        results[batchName] = r;
                    } catch {
                        results[batchName] = null;
                    }
                })
            );
            setRoutines(results);
            setRoutineImageLoading(false);
        };

        loadAllRoutines();
    }, [availableRoutineBatches]);

    const handleRoutineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file || !selectedRoutineBatch) return;
        if (!file.type.startsWith("image/")) {
            alert("দয়া করে একটি ইমেজ ফাইল (JPG/PNG/WebP) সিলেক্ট করুন।");
            return;
        }

        setUploadingRoutine(true);
        try {
            const saved = await uploadRoutineImage(selectedRoutineBatch, file);
            setRoutines(prev => ({ ...prev, [selectedRoutineBatch]: saved }));
        } catch (error: any) {
            console.error("Routine upload failed", error);
            alert(error?.message || "রুটিন আপলোড ব্যর্থ হয়েছে।");
        } finally {
            setUploadingRoutine(false);
        }
    };

    const batchCountSummary = useMemo(() => Object.keys(batchStats).sort(), [batchStats]);

    if (authLoading) {
        return <div className="p-8 text-center text-[#6b7280]">Loading profile...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">Class Routine</h1>
                        <p className="text-[#6b7280] mt-1">Upload and view batch-wise routine images for teachers and students.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardBody className="p-6 space-y-8">
                    {canManageRoutine && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-3">
                            <div>
                                <h2 className="text-lg font-semibold text-[#1f2937]">Routine Upload</h2>
                                <p className="text-sm text-[#6b7280] mt-1">এই সেকশনটি শুধুমাত্র Access Management-এ Routine/Edit access দেওয়া ব্যবহারকারী আপলোড ও replace করতে পারবেন।</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={selectedRoutineBatch}
                                    onChange={(e) => setSelectedRoutineBatch(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700"
                                >
                                    {availableRoutineBatches.map((batch) => (
                                        <option key={batch} value={batch}>{batch}</option>
                                    ))}
                                </select>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleRoutineUpload}
                                />
                                <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingRoutine || !selectedRoutineBatch}>
                                    {uploadingRoutine ? "Uploading..." : "Upload / Replace Routine Image"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Batch-wise Class Routines Grid: 1 col on mobile, 2 cols on PC */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Active Batch Routines
                        </h2>

                        {availableRoutineBatches.length === 0 ? (
                            <div className="py-8 text-center text-[#6b7280] bg-white rounded-lg border border-gray-100 italic">No active batch routine is available yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableRoutineBatches.map((batchName) => {
                                    const rImg = routines[batchName];
                                    return (
                                        <div key={batchName} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                                            <div style={{ backgroundColor: "#0D1B4A", textAlign: "center", padding: "12px 24px" }} className="shrink-0">
                                                <div style={{ color: "#FFFFFF", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1.2 }}>
                                                    {batchName}
                                                </div>
                                            </div>
                                            <div className="p-3 md:p-5 flex-1 flex flex-col items-center justify-center bg-gray-50/30 min-h-[220px]">
                                                {routineImageLoading && !rImg ? (
                                                    <div className="text-center py-8">
                                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669] mb-2"></div>
                                                        <p className="text-sm text-gray-500">Loading routine...</p>
                                                    </div>
                                                ) : rImg ? (
                                                    <button
                                                        onClick={() => setLightboxImage({ src: rImg.fileUrl, alt: `${batchName} class routine` })}
                                                        className="w-full text-left focus:outline-none block hover:opacity-95 transition-opacity cursor-zoom-in"
                                                        title="Click to zoom"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={rImg.fileUrl}
                                                            alt={`${batchName} class routine`}
                                                            className="w-full h-auto rounded-lg border border-gray-100"
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="text-center py-8 text-[#6b7280] italic text-sm">
                                                        🖼️ No class routine uploaded yet for {batchName}.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-[#1f2937]">Batch-wise Class Count</h2>
                                <p className="text-sm text-[#6b7280] mt-1">এখানে ব্যাচ অনুযায়ী ক্লাসের সংখ্যা দেখা যাবে। আপনি চাইলে Excel/Sheets থেকে manually update করতে পারেন।</p>
                            </div>
                            <span className="text-xs font-semibold text-[#1e3a5f] bg-blue-50 border border-blue-100 rounded-full px-3 py-1">Manual update ready</span>
                        </div>

                        {batchStatsLoading ? (
                            <div className="text-sm text-gray-500">Loading class count...</div>
                        ) : batchCountSummary.length === 0 ? (
                            <div className="text-sm text-gray-500">No batch class count data available yet.</div>
                        ) : (
                            <div className="space-y-6">
                                {batchCountSummary.map((batchName) => (
                                    <div key={batchName} className="border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="bg-[#1e3a5f] px-4 py-3 text-white font-semibold">{batchName}</div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50 text-gray-600">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold">#</th>
                                                        <th className="px-4 py-3 text-left font-semibold">Subject</th>
                                                        <th className="px-4 py-3 text-right font-semibold">Classes Taken</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {batchStats[batchName].map((item, idx) => (
                                                        <tr key={`${batchName}-${item.subjectName}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                            <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                                            <td className="px-4 py-3 text-gray-700">{item.subjectName}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-[#1e3a5f]">{item.classCount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {lightboxImage && (
                <ImageLightbox
                    src={lightboxImage.src}
                    alt={lightboxImage.alt}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </div>
    );
}
