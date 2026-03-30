"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StudentBatchInfo, saveBatchInfo, getAllBatchInfo } from "@/services/batchInfoService";
import Button from "@/components/ui/Button";
import * as XLSX from "xlsx";

// Inline SVG icons (retained from previous design)
const CheckCircleIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const PlayCircleIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
    </svg>
);
const AcademicCapIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
);
const XCircleIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 13.5 3-3m0 0 3-3m-3 3-3-3m3 3 3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);
const NoSymbolIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);
const BriefcaseIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.896 1.95-2 1.95H5.75c-1.104 0-2-.856-2-1.95v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
);
const BuildingOfficeIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
);
const QuestionMarkCircleIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
);
const CurrencyDollarIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const UserGroupIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
);
const MagnifyingGlassIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const ArrowDownTrayIcon = (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export default function AllBatchInfoPage() {
    const { userProfile } = useAuth();
    const [allStudents, setAllStudents] = useState<StudentBatchInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Batch Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newBatchName, setNewBatchName] = useState("");
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [isAddingRunningBatch, setIsAddingRunningBatch] = useState(false);

    // Search Features State
    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [selectedSearchBatch, setSelectedSearchBatch] = useState("all");

    // Address Preview Modal State
    const [viewingAddress, setViewingAddress] = useState<{ name: string; address: string } | null>(null);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedExportBatch, setSelectedExportBatch] = useState("all");

    // Grid Data Ref
    const MAX_ROWS = 200;
    const COLUMNS = ["roll", "name", "phone", "dob", "educationalDegree", "category", "bloodGroup", "address", "courseStatus", "currentlyDoing", "companyName", "businessName", "salary"];
    const gridRef = useRef<HTMLTableElement>(null);
    const rowDataRef = useRef<Record<string, string>[]>([]);

    const initializeEmptyRows = () => {
        return Array.from({ length: MAX_ROWS }).map(() =>
            Object.fromEntries(COLUMNS.map(c => [c, ""]))
        );
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAllBatchInfo();
            setAllStudents(data);
        } catch (error) {
            console.error("Error fetching batch info:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Separate students by batch type
    const completedStudentsList = allStudents.filter(s => s.batchType !== "Running");
    const runningStudentsList = allStudents.filter(s => s.batchType === "Running");

    // Derive stats from filtered batch (or all when 'all') ONLY for completed batches
    const filteredStudents = selectedSearchBatch === "all" ? completedStudentsList : completedStudentsList.filter(s => s.batchName === selectedSearchBatch);

    // Derived Statistics (always based on filteredStudents for real-time batch filtering)
    const uniqueBatchesCount = new Set(completedStudentsList.map(s => s.batchName)).size;
    const totalStudents = filteredStudents.length;
    const completedStudents = filteredStudents.filter(s => s.courseStatus === "Completed").length;
    const incompleteStudents = filteredStudents.filter(s => s.courseStatus === "Incomplete").length;
    const expelledStudents = filteredStudents.filter(s => s.courseStatus === "Expelled").length;

    const studentsJob = filteredStudents.filter(s => s.currentlyDoing === "Job").length;
    const studentsBusiness = filteredStudents.filter(s => s.currentlyDoing === "Business").length;
    const studentsFurtherStudy = filteredStudents.filter(s => s.currentlyDoing === "Nothing" || s.currentlyDoing === "Studying Further").length;

    const totalEarnings = filteredStudents.reduce((sum, student) => sum + (Number(student.salary) || 0), 0);
    const formattedEarnings = "৳ " + totalEarnings.toLocaleString();

    const isBatchFiltered = selectedSearchBatch !== "all";

    const overviewStats = [
        { label: isBatchFiltered ? "Batch" : "Completed Batches", value: isBatchFiltered ? selectedSearchBatch : uniqueBatchesCount.toString(), icon: CheckCircleIcon, color: "bg-emerald-500", lightColor: "bg-emerald-50", textColor: "text-emerald-700" },
        { label: "Total Student Admitted", value: totalStudents.toString(), icon: UserGroupIcon, color: "bg-blue-500", lightColor: "bg-blue-50", textColor: "text-blue-700" },
        { label: "Students Completed", value: completedStudents.toString(), icon: AcademicCapIcon, color: "bg-indigo-500", lightColor: "bg-indigo-50", textColor: "text-indigo-700" },
        { label: "Incomplete + Expelled", valueA: incompleteStudents.toString(), valueB: expelledStudents.toString(), labelA: "Incomplete", labelB: "Expelled", icon: XCircleIcon, iconB: NoSymbolIcon, color: "bg-orange-500", lightColor: "bg-orange-50", textColor: "text-orange-600", textColorB: "text-red-600", combined: true },
        { label: "Employed / Job", value: studentsJob.toString(), icon: BriefcaseIcon, color: "bg-cyan-500", lightColor: "bg-cyan-50", textColor: "text-cyan-700" },
        { label: "Doing Business", value: studentsBusiness.toString(), icon: BuildingOfficeIcon, color: "bg-purple-500", lightColor: "bg-purple-50", textColor: "text-purple-700" },
        { label: "Studying Further", value: studentsFurtherStudy.toString(), icon: QuestionMarkCircleIcon, color: "bg-slate-500", lightColor: "bg-slate-50", textColor: "text-slate-700" },
        { label: "Students Earning / Month", value: formattedEarnings, icon: CurrencyDollarIcon, color: "bg-emerald-600", lightColor: "bg-emerald-100", textColor: "text-emerald-800" },
    ];

    // Stats for Running Batches
    const runningBatchesFiltered = selectedSearchBatch === "all" ? runningStudentsList : runningStudentsList.filter(s => s.batchName === selectedSearchBatch);
    const runningUniqueBatchesCount = new Set(runningStudentsList.map(s => s.batchName)).size;
    const runningTotalStudents = runningBatchesFiltered.length;
    const runningIncomplete = runningBatchesFiltered.filter(s => s.courseStatus === "Incomplete").length;
    const runningExpelled = runningBatchesFiltered.filter(s => s.courseStatus === "Expelled").length;
    const runningActiveList = runningBatchesFiltered.length - runningIncomplete - runningExpelled;

    const runningStats = [
        { label: isBatchFiltered ? "Running Batch" : "Running Batches", value: isBatchFiltered ? selectedSearchBatch : runningUniqueBatchesCount.toString(), icon: PlayCircleIcon, color: "bg-blue-500", lightColor: "bg-blue-50", textColor: "text-blue-700" },
        { label: "Total Student Admitted", value: runningTotalStudents.toString(), icon: UserGroupIcon, color: "bg-purple-500", lightColor: "bg-purple-50", textColor: "text-purple-700" },
        { label: "Total Student Running", value: runningActiveList.toString(), icon: UserGroupIcon, color: "bg-emerald-500", lightColor: "bg-emerald-50", textColor: "text-emerald-700" },
        { label: "Incomplete + Expelled", valueA: runningIncomplete.toString(), valueB: runningExpelled.toString(), labelA: "Incomplete", labelB: "Expelled", icon: XCircleIcon, iconB: NoSymbolIcon, color: "bg-orange-500", lightColor: "bg-orange-50", textColor: "text-orange-600", textColorB: "text-red-600", combined: true },
    ];

    const searchResults = allStudents.filter(student => {
        const query = studentSearchQuery.toLowerCase();
        const matchesQuery = !query ||
            (student.name?.toLowerCase().includes(query)) ||
            (student.roll?.toLowerCase().includes(query)) ||
            (student.phone?.toLowerCase().includes(query));
        const matchesBatch = selectedSearchBatch === "all" || student.batchName === selectedSearchBatch;
        return matchesQuery && matchesBatch;
    });

    const isSearchActive = studentSearchQuery.trim() !== "" || selectedSearchBatch !== "all";

    // Batch-wise Aggregation (always over ALL students for the breakdown table)
    const batchStatsMap = allStudents.reduce((acc, student) => {
        if (!acc[student.batchName]) {
            acc[student.batchName] = {
                id: student.batchName,
                total: 0, completed: 0, incomplete: 0, expelled: 0, job: 0, business: 0, furtherStudy: 0
            };
        }
        const b = acc[student.batchName];
        b.total += 1;
        if (student.courseStatus === "Completed") b.completed += 1;
        if (student.courseStatus === "Incomplete") b.incomplete += 1;
        if (student.courseStatus === "Expelled") b.expelled += 1;
        if (student.currentlyDoing === "Job") b.job += 1;
        if (student.currentlyDoing === "Business") b.business += 1;
        if (student.currentlyDoing === "Nothing" || student.currentlyDoing === "Studying Further") b.furtherStudy += 1;
        return acc;
    }, {} as Record<string, any>);

    const batchWiseData = Object.values(batchStatsMap).sort((a, b) => a.id.localeCompare(b.id));
    const uniqueBatchesList = Array.from(new Set(allStudents.map(s => s.batchName))).sort();

    const handleSelectExistingBatch = (batchName: string) => {
        setNewBatchName(batchName);
        setIsEditingExisting(true);

        // Pre-fill grid data
        const batchStudents = allStudents.filter(s => s.batchName === batchName);
        const wasRunning = batchStudents.length > 0 && batchStudents[0].batchType === "Running";
        setIsAddingRunningBatch(wasRunning);
        rowDataRef.current = initializeEmptyRows();

        batchStudents.forEach((student, index) => {
            if (index < MAX_ROWS) {
                rowDataRef.current[index] = {
                    roll: student.roll || "",
                    name: student.name || "",
                    phone: student.phone || "",
                    dob: student.dob || "",
                    educationalDegree: student.educationalDegree || "",
                    category: student.category || "",
                    bloodGroup: student.bloodGroup || "",
                    address: student.address || "",
                    courseStatus: student.courseStatus || "",
                    currentlyDoing: student.currentlyDoing || "",
                    companyName: student.companyName || "",
                    businessName: student.businessName || "",
                    salary: student.salary ? student.salary.toString() : ""
                };
            }
        });

        setIsSelectionModalOpen(false);
        setIsAddModalOpen(true);
    };

    const handleOpenNewBatch = (isRunning: boolean = false) => {
        setNewBatchName("");
        setIsEditingExisting(false);
        setIsAddingRunningBatch(isRunning);
        rowDataRef.current = initializeEmptyRows();
        setIsSelectionModalOpen(false);
        setIsAddModalOpen(true);
    };

    // Form Event Handlers
    const handleCellBlur = useCallback((rowIndex: number, field: string, value: string) => {
        if (rowDataRef.current[rowIndex]) {
            rowDataRef.current[rowIndex] = { ...rowDataRef.current[rowIndex], [field]: value };
        }
    }, []);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement | HTMLSelectElement>, startRowIndex: number, startColKey: string) => {
        e.preventDefault();

        const clipboardData = e.clipboardData.getData('Text');
        if (!clipboardData) return;

        const pastedLines = clipboardData.split(/\r?\n/).filter(line => line.length > 0);
        const startColIndex = COLUMNS.indexOf(startColKey);
        if (startColIndex === -1) return;

        pastedLines.forEach((line, lineIndex) => {
            const cells = line.split('\t');
            const targetRowIndex = startRowIndex + lineIndex;

            if (targetRowIndex >= MAX_ROWS) return;

            cells.forEach((cellValue, cellIndex) => {
                const targetColIndex = startColIndex + cellIndex;
                if (targetColIndex < COLUMNS.length) {
                    const fieldKey = COLUMNS[targetColIndex];

                    if (rowDataRef.current[targetRowIndex]) {
                        rowDataRef.current[targetRowIndex] = {
                            ...rowDataRef.current[targetRowIndex],
                            [fieldKey]: cellValue
                        };
                    }

                    const input = gridRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(
                        `[data-row="${targetRowIndex}"][data-col="${fieldKey}"]`
                    );
                    if (input) input.value = cellValue;
                }
            });
        });
    };

    const handleSaveBatchInfo = async () => {
        if (!newBatchName.trim()) {
            alert("Please enter a valid Batch Name.");
            return;
        }

        setIsAdding(true);
        try {
            // Filter out purely empty rows
            const validRows = rowDataRef.current.filter(row =>
                row.roll && row.roll.trim() !== "" &&
                row.name && row.name.trim() !== ""
            );

            if (validRows.length === 0) {
                alert("Please add at least one student with a Roll and Name.");
                setIsAdding(false);
                return;
            }

            const cleanData = validRows.map(row => ({
                batchName: newBatchName,
                roll: row.roll,
                name: row.name,
                phone: row.phone || "",
                dob: row.dob || "",
                educationalDegree: row.educationalDegree || "",
                category: (row.category as any) || "",
                bloodGroup: row.bloodGroup || "",
                address: row.address || "",
                courseStatus: row.courseStatus as any,
                currentlyDoing: row.currentlyDoing as any,
                companyName: row.companyName || "",
                businessName: row.businessName || "",
                salary: Number(row.salary) || 0
            }));

            await saveBatchInfo(newBatchName, cleanData, isAddingRunningBatch ? "Running" : "Completed");
            await fetchData();
            setIsAddModalOpen(false);
            setIsEditingExisting(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save batch data. Please check console for details.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleCompleteBatch = async () => {
        if (!newBatchName.trim()) {
            alert("Please enter a valid Batch Name.");
            return;
        }

        if (confirm(`Are you sure you want to mark ${newBatchName} as Completed? This will change the status of all missing/running students to 'Completed'.`)) {
            setIsAdding(true);
            try {
                // Filter out purely empty rows
                const validRows = rowDataRef.current.filter(row =>
                    row.roll && row.roll.trim() !== "" &&
                    row.name && row.name.trim() !== ""
                );

                if (validRows.length === 0) {
                    alert("Please add at least one student with a Roll and Name.");
                    setIsAdding(false);
                    return;
                }

                const cleanData = validRows.map(row => {
                    let updatedStatus = row.courseStatus;
                    if (!updatedStatus || updatedStatus === "Running") {
                        updatedStatus = "Completed";
                    }

                    return {
                        batchName: newBatchName,
                        roll: row.roll,
                        name: row.name,
                        phone: row.phone || "",
                        dob: row.dob || "",
                        educationalDegree: row.educationalDegree || "",
                        category: (row.category as any) || "",
                        bloodGroup: row.bloodGroup || "",
                        address: row.address || "",
                        courseStatus: updatedStatus as any,
                        currentlyDoing: row.currentlyDoing as any,
                        companyName: row.companyName || "",
                        businessName: row.businessName || "",
                        salary: Number(row.salary) || 0
                    };
                });

                await saveBatchInfo(newBatchName, cleanData, "Completed", new Date());
                await fetchData();
                setIsAddModalOpen(false);
                setIsEditingExisting(false);
            } catch (error) {
                console.error(error);
                alert("Failed to complete batch. Please check console for details.");
            } finally {
                setIsAdding(false);
            }
        }
    };

    const executeExportExcel = (batchName: string) => {
        try {
            const isAll = batchName === "all";
            const currentExportStudents = isAll ? allStudents : allStudents.filter(s => s.batchName === batchName);

            // Calculate stats for this specific export
            const expTotalStudents = currentExportStudents.length;
            const expCompleted = currentExportStudents.filter(s => s.courseStatus === "Completed").length;
            const expIncomplete = currentExportStudents.filter(s => s.courseStatus === "Incomplete").length;
            const expExpelled = currentExportStudents.filter(s => s.courseStatus === "Expelled").length;
            const expJob = currentExportStudents.filter(s => s.currentlyDoing === "Job").length;
            const expBusiness = currentExportStudents.filter(s => s.currentlyDoing === "Business").length;
            const expFurtherStudy = currentExportStudents.filter(s => s.currentlyDoing === "Nothing" || s.currentlyDoing === "Studying Further").length;
            const expEarnings = currentExportStudents.reduce((sum, s) => sum + (Number(s.salary) || 0), 0);

            const wb = XLSX.utils.book_new();
            const sheetData: any[][] = [];

            // 1. Overview Summary Header
            sheetData.push(["Overview Summary", ""]);
            sheetData.push(["Metric", "Value"]);
            sheetData.push([isAll ? "Completed Batches" : "Batch Name", isAll ? uniqueBatchesCount : batchName]);
            sheetData.push(["Total Student Admitted", expTotalStudents]);
            sheetData.push(["Students Completed", expCompleted]);
            sheetData.push(["Incomplete", expIncomplete]);
            sheetData.push(["Expelled", expExpelled]);
            sheetData.push(["Employed / Job", expJob]);
            sheetData.push(["Doing Business", expBusiness]);
            sheetData.push(["Studying Further", expFurtherStudy]);
            sheetData.push(["Students Earning / Month", expEarnings]);

            // Leave empty rows
            sheetData.push([]);
            sheetData.push([]);

            // 2. Student List Header
            sheetData.push(["Student List"]);
            sheetData.push(["Batch", "Roll", "Name", "Phone", "Date of Birth", "Educational Degree", "Category", "Blood Group", "Address", "Status", "Currently", "Company Name", "Business Name", "Salary"]);

            // 3. Student Data
            currentExportStudents.forEach(s => {
                sheetData.push([
                    s.batchName || "-",
                    s.roll || "-",
                    s.name || "-",
                    s.phone || "-",
                    s.dob || "-",
                    s.educationalDegree || "-",
                    s.category || "-",
                    s.bloodGroup || "-",
                    s.address || "-",
                    s.courseStatus || "-",
                    s.currentlyDoing === 'Nothing' ? 'Studying Further' : (s.currentlyDoing || "-"),
                    s.companyName || "-",
                    s.businessName || "-",
                    s.salary ? `৳ ${s.salary.toLocaleString()}` : "-"
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(sheetData);

            ws['!cols'] = [
                { wch: 18 }, // Batch / Metric
                { wch: 15 }, // Roll / Value
                { wch: 25 }, // Name
                { wch: 15 }, // Phone
                { wch: 30 }, // Address
                { wch: 12 }, // Status
                { wch: 18 }, // Currently
                { wch: 20 }, // Company Name
                { wch: 20 }, // Business Name
                { wch: 15 }, // Salary
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Batch Data");

            const fileName = `Batch_Data_${isAll ? 'All' : batchName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            setIsExportModalOpen(false);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Failed to export data to Excel.");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-[#059669] rounded-full"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#1f2937]">
                            All Batch Information
                        </h1>
                        <p className="text-[#6b7280] mt-1">
                            Comprehensive overview of batch statistics, student outcomes, and students earning.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {userProfile?.role === "admin" && (
                        <button
                            onClick={() => setIsSelectionModalOpen(true)}
                            className="px-4 py-2.5 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#10b981] transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Manage Batch Data
                        </button>
                    )}
                </div>
            </div>

            {/* Search Filters Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="Search student by Name, Roll, or Phone Number..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors"
                    />
                </div>
                <div className="w-full md:w-64 shrink-0">
                    <select
                        value={selectedSearchBatch}
                        onChange={(e) => setSelectedSearchBatch(e.target.value)}
                        className="block w-full py-2.5 px-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors"
                    >
                        <option value="all">💳 All Batches</option>
                        {uniqueBatchesList.map(batchName => (
                            <option key={batchName} value={batchName}>{batchName}</option>
                        ))}
                    </select>
                </div>
                <div className="shrink-0">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f0fdf4] text-[#059669] border border-[#059669]/20 text-sm font-semibold rounded-xl hover:bg-[#dcfce7] transition-colors shadow-sm whitespace-nowrap"
                        title="Download Data to Excel"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download Data
                    </button>
                </div>
            </div>



            {/* Address Preview Modal */}
            {viewingAddress && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setViewingAddress(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-[#1e3a5f] px-5 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold text-base">Full Address</h3>
                                <p className="text-blue-200 text-xs mt-0.5">{viewingAddress.name}</p>
                            </div>
                            <button
                                onClick={() => setViewingAddress(null)}
                                className="text-blue-200 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-gray-700 text-sm leading-relaxed">{viewingAddress.address}</p>
                            </div>
                        </div>
                        <div className="px-5 pb-4">
                            <button
                                onClick={() => setViewingAddress(null)}
                                className="w-full py-2 bg-[#059669] text-white text-sm font-semibold rounded-lg hover:bg-[#047857] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Selection Modal */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsExportModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Download Data</h3>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Batch to Download</label>
                            <select
                                value={selectedExportBatch}
                                onChange={(e) => setSelectedExportBatch(e.target.value)}
                                className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669] sm:text-sm transition-colors mb-6"
                            >
                                <option value="all">💳 All Batches</option>
                                {uniqueBatchesList.map(batchName => (
                                    <option key={batchName} value={batchName}>{batchName}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => executeExportExcel(selectedExportBatch)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#059669] text-white text-sm font-semibold rounded-xl hover:bg-[#047857] transition-colors shadow-sm"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Download Excel File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Stats Grid */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]"></div>
                    <span className="ml-3 text-gray-500">Loading metrics...</span>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {overviewStats.map((stat, index) => {
                            const Icon = stat.icon;
                            if ((stat as any).combined) {
                                const IconB = (stat as any).iconB;
                                return (
                                    <div
                                        key={index}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-500 mb-2">{stat.label}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-400 mb-0.5">{(stat as any).labelA}</p>
                                                    <span className={"text-2xl lg:text-3xl font-bold " + stat.textColor}>{(stat as any).valueA}</span>
                                                </div>
                                                <span className="text-2xl font-light text-gray-300 pb-0 mt-4">+</span>
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-400 mb-0.5">{(stat as any).labelB}</p>
                                                    <span className={"text-2xl lg:text-3xl font-bold " + (stat as any).textColorB}>{(stat as any).valueB}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={"flex flex-col gap-1.5 p-2 rounded-xl " + stat.lightColor}>
                                            <Icon className={"w-5 h-5 " + stat.textColor} />
                                            <IconB className={"w-5 h-5 " + (stat as any).textColorB} />
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                        <h3 className={"text-2xl lg:text-3xl font-bold " + stat.textColor}>{stat.value}</h3>
                                    </div>
                                    <div className={"p-3 rounded-xl transition-colors duration-300 " + stat.lightColor}>
                                        <Icon className={"w-7 h-7 " + stat.textColor} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Running Batches Stats Grid */}
                    {(!isBatchFiltered || runningTotalStudents > 0) && (
                        <div className="pt-2 animate-in fade-in duration-500">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Current Running Batches
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {runningStats.map((stat, index) => {
                                    const Icon = stat.icon;
                                    if ((stat as any).combined) {
                                        const IconB = (stat as any).iconB;
                                        return (
                                            <div
                                                key={`run-${index}`}
                                                className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-500 mb-2">{stat.label}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-400 mb-0.5">{(stat as any).labelA}</p>
                                                            <span className={"text-2xl lg:text-3xl font-bold " + stat.textColor}>{(stat as any).valueA}</span>
                                                        </div>
                                                        <span className="text-2xl font-light text-gray-300 pb-0 mt-4">+</span>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-400 mb-0.5">{(stat as any).labelB}</p>
                                                            <span className={"text-2xl lg:text-3xl font-bold " + (stat as any).textColorB}>{(stat as any).valueB}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={"flex flex-col gap-1.5 p-2 rounded-xl " + stat.lightColor}>
                                                    <Icon className={"w-5 h-5 " + stat.textColor} />
                                                    <IconB className={"w-5 h-5 " + (stat as any).textColorB} />
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div
                                            key={`run-${index}`}
                                            className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                                <h3 className={"text-2xl lg:text-3xl font-bold " + stat.textColor}>{stat.value}</h3>
                                            </div>
                                            <div className={"p-3 rounded-xl transition-colors duration-300 " + stat.lightColor}>
                                                <Icon className={"w-7 h-7 " + stat.textColor} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Student Table for batch-filtered view */}
            {!loading && isBatchFiltered && (
                <div className="bg-white rounded-2xl shadow-sm border border-[#059669]/20 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-[#059669]/5 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-[#059669] flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5" />
                            {selectedSearchBatch} — Students ({searchResults.length})
                        </h2>
                        {studentSearchQuery && (
                            <span className="text-xs text-gray-500">Filtered by name / roll / phone</span>
                        )}
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#1e3a5f] text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium border border-[#2d5278]">Roll</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[150px]">Name</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278]">Phone</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[120px]">Date of Birth</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[150px]">Educational Degree</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278]">Category</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[100px]">Blood Group</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[200px]">Address</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278]">Status</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278]">Currently</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[120px]">Company</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278] min-w-[120px]">Business</th>
                                    <th className="px-4 py-3 font-medium border border-[#2d5278]">Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                                            <NoSymbolIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p>No students found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    searchResults.map((student, idx) => (
                                        <tr
                                            key={student.id}
                                            className={idx % 2 === 0 ? "bg-white hover:bg-gray-50 transition-colors" : "bg-[#f9fafb] hover:bg-gray-50 transition-colors"}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">{student.roll}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-semibold border-b border-gray-200">{student.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">{student.phone}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">{student.dob || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">{student.educationalDegree || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                                                {student.category ? (
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${student.category === 'Alim' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                                        {student.category}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 text-center">
                                                <span className="font-bold text-red-600">{student.bloodGroup || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 max-w-[200px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="truncate block flex-1">{student.address || "-"}</span>
                                                    {student.address && (
                                                        <button
                                                            onClick={() => setViewingAddress({ name: student.name, address: student.address })}
                                                            title="View full address"
                                                            className="shrink-0 text-gray-400 hover:text-[#059669] transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm border-b border-gray-200">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${student.courseStatus === 'Completed' ? 'bg-emerald-100/50 text-emerald-700' :
                                                    student.courseStatus === 'Incomplete' ? 'bg-orange-100/50 text-orange-700' :
                                                        student.courseStatus === 'Expelled' ? 'bg-red-100/50 text-red-700' : 'text-gray-500'
                                                    }`}>{student.courseStatus || "-"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm border-b border-gray-200">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${student.currentlyDoing === 'Job' ? 'bg-cyan-100/50 text-cyan-700' :
                                                    student.currentlyDoing === 'Business' ? 'bg-purple-100/50 text-purple-700' :
                                                        (student.currentlyDoing === 'Nothing' || student.currentlyDoing === 'Studying Further') ? 'bg-slate-100 text-slate-600' : 'text-gray-500'
                                                    }`}>{student.currentlyDoing === 'Nothing' ? 'Studying Further' : (student.currentlyDoing || "-")}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">{student.companyName || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">{student.businessName || "-"}</td>
                                            <td className="px-4 py-3 text-sm text-emerald-700 font-medium border-b border-gray-200">
                                                {student.salary ? `৳ ${student.salary.toLocaleString()}` : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Batch-wise Breakdown Section (only for All Batches) */}
            {!loading && !isBatchFiltered && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform transition-all duration-300">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5 text-gray-500" />
                            Batch-wise Breakdown ({totalStudents} Students Total)
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1e3a5f] text-white text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-medium border border-[#2d5278]">Batch No.</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Total Students</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Completed</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Incomplete</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Expelled</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Job</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Business</th>
                                    <th className="px-6 py-4 font-medium text-center border border-[#2d5278]">Studying Further</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchWiseData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 italic">
                                            No batch data has been added yet. Add a batch to see breakdown.
                                        </td>
                                    </tr>
                                ) : (
                                    batchWiseData.map((batch, idx) => (
                                        <tr
                                            key={idx}
                                            className={idx % 2 === 0 ? "bg-white hover:bg-gray-50 transition-colors" : "bg-[#f9fafb] hover:bg-gray-50 transition-colors"}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200 border-r">
                                                <div className="font-semibold text-gray-900">{batch.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600 font-medium border-b border-gray-200">{batch.total}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-emerald-600 font-semibold border-b border-gray-200">{batch.completed}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-orange-600 font-semibold border-b border-gray-200">{batch.incomplete}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 font-semibold border-b border-gray-200">{batch.expelled}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-cyan-600 font-semibold border-b border-gray-200">{batch.job}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-purple-600 font-semibold border-b border-gray-200">{batch.business}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-500 font-medium border-b border-gray-200">{batch.furtherStudy}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Batch Selection Modal */}
            {isSelectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsSelectionModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Manage Batch Data</h3>
                                <p className="text-sm text-gray-500 mt-1">Select an existing batch to edit its data, or add a completely new batch.</p>
                            </div>
                            <button onClick={() => setIsSelectionModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-8">
                            {/* Completed Batches Section */}
                            <div>
                                <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Completed Batches</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => handleOpenNewBatch(false)}
                                        className="h-28 border-2 border-dashed border-[#059669] rounded-xl flex flex-col items-center justify-center gap-2 text-[#059669] hover:bg-[#059669]/5 transition-colors group"
                                    >
                                        <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="font-semibold text-sm">Add New Completed Batch</span>
                                    </button>

                                    {Array.from(new Set(completedStudentsList.map(s => s.batchName))).map((bName) => (
                                        <button
                                            key={bName}
                                            onClick={() => handleSelectExistingBatch(bName)}
                                            className="h-28 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#059669] hover:shadow-md transition-all group bg-white"
                                        >
                                            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <div className="text-center px-2">
                                                <span className="font-semibold text-gray-800 text-sm block truncate w-full" title={bName}>{bName}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{completedStudentsList.filter(s => s.batchName === bName).length} Students</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Running Batches Section */}
                            <div>
                                <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Current Batches</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => handleOpenNewBatch(true)}
                                        className="h-28 border-2 border-dashed border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors group"
                                    >
                                        <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="font-semibold text-sm">Add New Running Batch</span>
                                    </button>

                                    {Array.from(new Set(runningStudentsList.map(s => s.batchName))).map((bName) => (
                                        <button
                                            key={bName}
                                            onClick={() => handleSelectExistingBatch(bName)}
                                            className="h-28 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-md transition-all group bg-white"
                                        >
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                                                </svg>
                                            </div>
                                            <div className="text-center px-2">
                                                <span className="font-semibold text-gray-800 text-sm block truncate w-full" title={bName}>{bName}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{runningStudentsList.filter(s => s.batchName === bName).length} Students</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Batch Data Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col my-8" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white z-10 rounded-t-xl shrink-0 gap-4">
                            <div className="w-full md:w-auto flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Add New Batch Info</h3>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full max-w-md">
                                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Batch Name:</label>
                                    <div className="w-full relative">
                                        <input
                                            type="text"
                                            value={newBatchName}
                                            onChange={(e) => setNewBatchName(e.target.value)}
                                            placeholder="e.g. Batch_01"
                                            disabled={isEditingExisting}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#059669] focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                        {isEditingExisting && <div className="text-xs text-emerald-600 absolute -bottom-5">Editing existing batch.</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center shrink-0">
                                <button onClick={() => {
                                    if (confirm('Clear all grid data?')) {
                                        rowDataRef.current = initializeEmptyRows();
                                        if (gridRef.current) {
                                            gridRef.current.querySelectorAll('input, select').forEach((el) => {
                                                (el as HTMLInputElement | HTMLSelectElement).value = "";
                                            });
                                        }
                                    }
                                }} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 border border-red-200 rounded">
                                    Clear Grid
                                </button>
                                {isAddingRunningBatch && (
                                    <button onClick={handleCompleteBatch} disabled={isAdding} className="text-[#059669] hover:text-[#047857] text-sm font-semibold px-3 py-1.5 border border-[#059669] rounded flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Complete Batch
                                    </button>
                                )}
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 bg-gray-50">
                            <table ref={gridRef} className="w-full border-collapse bg-white shadow-sm">
                                <thead className="sticky top-0 z-20 shadow-sm">
                                    <tr className="bg-[#1e3a5f]">
                                        <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-white border border-[#2d5278]">#</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[70px]">Roll</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[150px]">Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[120px]">Phone</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[120px]">Date of Birth</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[140px]">Educational Degree</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Category</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[100px]">Blood Group</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[150px]">Address</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[120px]">Course Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[120px]">Currently Doing</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Company Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] min-w-[130px]">Business Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-white border border-[#2d5278] w-[130px]">Salary / Income</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: MAX_ROWS }).map((_, idx) => (
                                        <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors group">
                                            <td className="p-1 border border-gray-200 text-center text-xs text-gray-400 bg-gray-50 select-none">
                                                {idx + 1}
                                            </td>
                                            {COLUMNS.map(col => (
                                                <td key={col} className={`p-0 border border-gray-200`}>
                                                    {col === "courseStatus" ? (
                                                        <select
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onChange={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={e => handlePaste(e as any, idx, col)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none text-[#1f2937]"
                                                        >
                                                            <option value=""></option>
                                                            {isAddingRunningBatch ? (
                                                                <>
                                                                    <option value="Running">Running</option>
                                                                    <option value="Completed">Completed</option>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <option value="Completed">Completed</option>
                                                                    <option value="Running">Running</option>
                                                                </>
                                                            )}
                                                            <option value="Incomplete">Incomplete</option>
                                                            <option value="Expelled">Expelled</option>
                                                        </select>
                                                    ) : col === "category" ? (
                                                        <select
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onChange={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={e => handlePaste(e as any, idx, col)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none text-[#1f2937]"
                                                        >
                                                            <option value=""></option>
                                                            <option value="Alim">Alim</option>
                                                            <option value="General">General</option>
                                                        </select>
                                                    ) : col === "bloodGroup" ? (
                                                        <select
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onChange={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={e => handlePaste(e as any, idx, col)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none text-[#1f2937]"
                                                        >
                                                            <option value=""></option>
                                                            <option value="A+">A+</option>
                                                            <option value="A-">A-</option>
                                                            <option value="B+">B+</option>
                                                            <option value="B-">B-</option>
                                                            <option value="AB+">AB+</option>
                                                            <option value="AB-">AB-</option>
                                                            <option value="O+">O+</option>
                                                            <option value="O-">O-</option>
                                                        </select>
                                                    ) : col === "currentlyDoing" ? (
                                                        <select
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onChange={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={e => handlePaste(e as any, idx, col)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none text-[#1f2937]"
                                                        >
                                                            <option value=""></option>
                                                            <option value="Job">Job</option>
                                                            <option value="Business">Business</option>
                                                            <option value="Studying Further">Studying Further</option>
                                                        </select>
                                                    ) : col === "salary" ? (
                                                        <input
                                                            type="number"
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onBlur={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={(e) => handlePaste(e, idx, col)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none font-medium text-emerald-700"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            defaultValue={rowDataRef.current[idx]?.[col] ?? ""}
                                                            data-row={idx}
                                                            data-col={col}
                                                            onBlur={e => handleCellBlur(idx, col, e.target.value)}
                                                            onPaste={(e) => handlePaste(e, idx, col)}
                                                            className="w-full p-2 bg-transparent text-sm focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none"
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl bg-white sticky bottom-0 z-10 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <span className="text-gray-500 text-sm hidden md:flex items-center mr-auto">Tip: You can paste data directly from Excel into the grid cells.</span>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveBatchInfo} disabled={isAdding} className="bg-[#059669] hover:bg-[#047857] text-white px-8">
                                {isAdding ? "Saving Batch..." : "Save Batch Data"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
