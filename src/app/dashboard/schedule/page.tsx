"use client";

import { useEffect, useState } from "react";
import Card, { CardBody } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { getBatches, BatchItem } from "@/services/scheduleService";
import { getRoutineByBatch, BatchRoutine } from "@/services/routinesService";

export default function SchedulePage() {
    const { loading: authLoading } = useAuth();

    const [selectedRoutineBatch, setSelectedRoutineBatch] = useState("");
    const [routineImage, setRoutineImage] = useState<BatchRoutine | null>(null);
    const [routineImageLoading, setRoutineImageLoading] = useState(false);
    const [availableRoutineBatches, setAvailableRoutineBatches] = useState<string[]>([]);

    useEffect(() => {
        getBatches()
            .then((batches: BatchItem[]) => {
                const activeBatchNames = batches.filter((b) => b.status === "active").map((b) => b.name).sort();
                setAvailableRoutineBatches(activeBatchNames);
                if (activeBatchNames.length > 0) {
                    setSelectedRoutineBatch(activeBatchNames[activeBatchNames.length - 1]);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedRoutineBatch) return;
        setRoutineImageLoading(true);
        getRoutineByBatch(selectedRoutineBatch)
            .then(setRoutineImage)
            .catch(console.error)
            .finally(() => setRoutineImageLoading(false));
    }, [selectedRoutineBatch]);

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
                <CardBody className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-2">
                        {availableRoutineBatches.length === 0 ? (
                            <p className="text-sm text-[#6b7280]">No active batch routine is available yet.</p>
                        ) : (
                            availableRoutineBatches.map((batch) => (
                                <button
                                    key={batch}
                                    onClick={() => setSelectedRoutineBatch(batch)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        selectedRoutineBatch === batch
                                            ? "bg-[#1e3a5f] text-white shadow-sm"
                                            : "bg-white text-[#1e3a5f] border border-[#1e3a5f] hover:bg-[#f0f4ff]"
                                    }`}
                                >
                                    {batch}
                                </button>
                            ))
                        )}
                    </div>

                    {routineImageLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#059669] mb-3"></div>
                                <p className="text-gray-500 font-medium">Loading routine...</p>
                            </div>
                        </div>
                    ) : !selectedRoutineBatch ? (
                        <div className="py-8 text-center text-[#6b7280] bg-white rounded-lg border border-gray-100 italic">No batch selected.</div>
                    ) : !routineImage ? (
                        <div className="py-8 text-center text-[#6b7280] bg-white rounded-lg border border-gray-100 italic">No class routine uploaded yet for {selectedRoutineBatch}.</div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div style={{ backgroundColor: "#0D1B4A", textAlign: "center", padding: "10px 24px" }}>
                                <div style={{ color: "#FFFFFF", fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)", fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1.2 }}>{selectedRoutineBatch}</div>
                            </div>
                            <div className="p-3 md:p-5">
                                <a href={routineImage.fileUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
                                    <img
                                        src={routineImage.fileUrl}
                                        alt={`${selectedRoutineBatch} class routine`}
                                        className="w-full h-auto rounded-lg border border-gray-100"
                                    />
                                </a>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
