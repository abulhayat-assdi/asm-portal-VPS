import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    orderBy,
    writeBatch,
    doc,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ClassSchedule {
    id?: string;
    teacherId: string;
    teacherName: string;
    date: string;
    day: string;
    batch: string;
    subject: string;
    time: string;
    // Normalized status for frontend logic
    // REQUEST_TO_COMPLETE added
    status: "Completed" | "Scheduled" | "Upcoming" | "Pending" | "Today" | "Requested";
}

export interface BatchItem {
    id: string;
    name: string;
    status: "active" | "archived";
    createdAt: Timestamp | null;
}

export interface FirestoreClass {
    teacherUid: string;
    teacherName: string;
    date: string;
    startTime: string;
    endTime: string;
    batch: string;
    subject: string;
    status: "REQUEST_TO_COMPLETE" | "COMPLETED" | "PENDING";
    completedByUid?: string | null;
    completedAt?: Timestamp | null;
    createdAt?: Timestamp | null;
}

// Helper to normalize date string to YYYY-MM-DD
const getNormalizedDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const day = d.padStart(2, '0');
        const month = m.padStart(2, '0');
        return `${y}-${month}-${day}`;
    }
    // Fallback: try standard Date parse
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    } catch { }
    return dateStr;
};

// Helper to get current week's start (Saturday) and end (Friday) boundary in YYYY-MM-DD
const getCurrentWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToSaturday);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
    };
};

/**
 * Fetch class schedules for a specific teacher via API (Sheets) 
 * AND Firestore (for overrides/requests)
 */
export const getClassesByTeacherId = async (teacherId: string, teacherUid?: string, filterCurrentWeek: boolean = true): Promise<ClassSchedule[]> => {
    try {
        // 1. Fetch Request/Status Overrides from Firestore
        // These are actions the teacher or admin took that might not be in Sheets yet
        // OR are pending admin approval
        const firestoreClasses: FirestoreClass[] = [];
        try {
            const classesRef = collection(db, "classes");
            // Use teacherUid for overrides if provided, otherwise fallback to teacherId
            const q = query(classesRef, where("teacherUid", "==", teacherUid || teacherId));
            // We fetch all for this teacher to catch matching overrides
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => firestoreClasses.push(doc.data() as FirestoreClass));
        } catch (e) {
            console.error("Firestore fetch error (skipping override):", e);
        }

        // 1.5 Fetch Newly Added Schedules from `class_schedules`
        const customSchedules: ClassSchedule[] = [];
        try {
            const schedulesRef = collection(db, "class_schedules");
            const qs = query(schedulesRef, where("teacherId", "==", teacherId));
            const snap = await getDocs(qs);
            snap.forEach(doc => customSchedules.push(doc.data() as ClassSchedule));
        } catch (e) {
            console.error("Error fetching custom schedules:", e);
        }

        let classes: ClassSchedule[] = [...customSchedules];

        // 3. Merge & Process Logic based on Date
        const today = getNormalizedDate(new Date().toISOString());
        const weekRange = getCurrentWeekRange();

        return classes.filter(cls => {
            if (!filterCurrentWeek) return true;
            const normalizedDate = getNormalizedDate(cls.date);
            // Strictly bound the view to Saturday-Friday week.
            return normalizedDate >= weekRange.start && normalizedDate <= weekRange.end;
        }).map(cls => {
            const normalizedDate = getNormalizedDate(cls.date);
            const currentStatusLower = (cls.status || "").toLowerCase().trim();

            const override = firestoreClasses.find(fc =>
                getNormalizedDate(fc.date) === normalizedDate &&
                fc.startTime === cls.time.split('-')[0].trim() &&
                fc.batch === cls.batch &&
                fc.subject === cls.subject
            );

            let computedStatus: ClassSchedule["status"] = "Pending";

            if (override) {
                if (override.status === "REQUEST_TO_COMPLETE") {
                    computedStatus = "Requested";
                } else if (override.status === "COMPLETED") {
                    computedStatus = "Completed";
                } else if (override.status === "PENDING") {
                    computedStatus = "Requested";
                }
            } else {
                if (currentStatusLower === 'completed') {
                    computedStatus = "Completed";
                } else {
                    if (normalizedDate <= today) {
                        computedStatus = "Today";
                    } else {
                        computedStatus = "Pending";
                    }
                }
            }

            return {
                ...cls,
                status: computedStatus
            };
        }).sort((a, b) => {
            const dateA = getNormalizedDate(a.date);
            const dateB = getNormalizedDate(b.date);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });

    } catch (error) {
        console.error("Error fetching class schedule:", error);
        return [];
    }
};

/**
 * Fetch all class schedules from Firestore (For Admin Grid Sync)
 */
export const getAllClassesSchedules = async (filterCurrentWeek: boolean = true): Promise<ClassSchedule[]> => {
    try {
        const schedulesRef = collection(db, "class_schedules");
        // Always try to return sorted by date natively if possible, or application level
        const snapshot = await getDocs(schedulesRef);

        const schedules: ClassSchedule[] = [];
        snapshot.forEach(doc => {
            schedules.push({ id: doc.id, ...doc.data(), status: doc.data().status || "Scheduled" } as ClassSchedule);
        });

        // Compute dynamic status for these as well
        const d = new Date();
        const today = getNormalizedDate(d.toISOString());
        const weekRange = getCurrentWeekRange();

        return schedules.filter(cls => {
            if (!filterCurrentWeek) return true;
            const normalizedDate = getNormalizedDate(cls.date);
            return normalizedDate >= weekRange.start && normalizedDate <= weekRange.end;
        }).map(cls => {
            const normalizedDate = getNormalizedDate(cls.date);
            let computedStatus: ClassSchedule["status"] = "Pending";

            // Treat today and any past uncompleted class as "Today" (meaning it needs "Done" button)
            if (normalizedDate <= today) {
                computedStatus = "Today";
            }

            // Note: we're not checking completion overrides here for simplicity unless requested
            // Normally you would fetch the 'classes' overrides as well and merge.

            return {
                ...cls,
                status: computedStatus
            };
        }).sort((a, b) => {
            const dateA = getNormalizedDate(a.date);
            const dateB = getNormalizedDate(b.date);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });
    } catch (error) {
        console.error("Error fetching all class schedules:", error);
        return [];
    }
};

/**
 * Bulk add class schedules to Firestore 'class_schedules' collection
 */
export const addBatchClassSchedules = async (schedules: Omit<ClassSchedule, "status">[]) => {
    try {
        // 1. Filter out empty rows (Require at least Date, Batch, Teacher ID)
        const validSchedules = schedules.filter(s => s.date?.trim() && s.batch?.trim() && s.teacherId?.trim());

        if (validSchedules.length === 0) return true;

        // 2. Chunk processing (Firestore batch limit is 500 operations)
        // We'll use 400 to be safe
        const CHUNK_SIZE = 400;
        const schedulesRef = collection(db, "class_schedules");

        const chunks = [];
        for (let i = 0; i < validSchedules.length; i += CHUNK_SIZE) {
            chunks.push(validSchedules.slice(i, i + CHUNK_SIZE));
        }

        // 3. Process batches concurrently
        const batchPromises = chunks.map(chunk => {
            const batch = writeBatch(db);
            chunk.forEach(schedule => {
                const newDocRef = doc(schedulesRef);
                // Strip out any empty/extra fields we don't need or standardizing
                batch.set(newDocRef, {
                    date: schedule.date?.trim() || "",
                    day: schedule.day?.trim() || "",
                    batch: schedule.batch?.trim() || "",
                    subject: schedule.subject?.trim() || "",
                    time: schedule.time?.trim() || "",
                    teacherId: schedule.teacherId?.trim() || "",
                    teacherName: schedule.teacherName?.trim() || "",
                    status: "Scheduled", // Default status
                    createdAt: serverTimestamp()
                });
            });
            return batch.commit();
        });

        await Promise.all(batchPromises);
        return true;
    } catch (error) {
        console.error("Error saving batch schedules:", error);
        throw error;
    }
};

/**
 * Full Sync class schedules from Grid to Firestore 'class_schedules' collection
 * Handles Create, Update, and Delete entirely implicitly based on ID boundaries.
 */
export const syncBatchClassSchedules = async (schedules: Partial<ClassSchedule>[]) => {
    try {
        const schedulesRef = collection(db, "class_schedules");
        const CHUNK_SIZE = 400; // Keep under 500 max limits
        
        const chunks = [];
        for (let i = 0; i < schedules.length; i += CHUNK_SIZE) {
            chunks.push(schedules.slice(i, i + CHUNK_SIZE));
        }

        const batchPromises = chunks.map(chunk => {
            const batch = writeBatch(db);
            
            chunk.forEach(schedule => {
                const hasId = !!schedule.id?.trim();
                const hasValidData = !!(schedule.date?.trim() && schedule.batch?.trim() && schedule.teacherId?.trim());
                
                if (hasId && !hasValidData) {
                    // Scenario: Row had an ID from DB, but user cleared it entirely. Delete it!
                    const docRef = doc(db, "class_schedules", schedule.id as string);
                    batch.delete(docRef);
                } 
                else if (hasId && hasValidData) {
                    // Scenario: Row existed, and user might have edited it. Update it.
                    const docRef = doc(db, "class_schedules", schedule.id as string);
                    // Dynamically spread to support new excel-like columns
                    const { id, ...updateData } = schedule;
                    batch.update(docRef, updateData as Record<string, string | Timestamp | undefined>);
                }
                else if (!hasId && hasValidData) {
                    // Scenario: Fresh empty row was typed into. Create it.
                    const newDocRef = doc(schedulesRef);
                    const { id, ...insertData } = schedule;
                    const finalData = { ...insertData, createdAt: serverTimestamp() };
                    if (!finalData.status) finalData.status = "Scheduled";
                    batch.set(newDocRef, finalData);
                }
            });
            return batch.commit();
        });

        await Promise.all(batchPromises);
        return true;
    } catch (error) {
        console.error("Error syncing schedules:", error);
        throw error;
    }
};

/**
 * Request Admin to Complete a Class
 * Creates a record in Firestore 'classes' collection
 */
export const requestClassCompletion = async (
    teacherId: string,
    teacherName: string,
    scheduleItem: ClassSchedule
) => {
    try {
        const normalizedDate = getNormalizedDate(scheduleItem.date);
        // Extract start/end time from "10.00-12.00" format
        const [start, end] = scheduleItem.time.split(/[-–]/).map(t => t.trim());

        await addDoc(collection(db, "classes"), {
            teacherUid: teacherId,
            teacherName: teacherName,
            date: normalizedDate,
            startTime: start || scheduleItem.time,
            endTime: end || "",
            timeRange: scheduleItem.time, // Exact string from Sheet logic validation
            batch: scheduleItem.batch,
            subject: scheduleItem.subject,
            status: "REQUEST_TO_COMPLETE",
            completedByUid: null,
            completedAt: null,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error requesting completion:", error);
        throw error;
    }
};

/**
 * Directly mark a class as 'Completed'
 * Works similarly to requestClassCompletion but unconditionally sets Completed
 */
export const markClassAsCompleted = async (
    teacherId: string,
    teacherName: string,
    scheduleItem: ClassSchedule
) => {
    try {
        const normalizedDate = getNormalizedDate(scheduleItem.date);
        const [start, end] = scheduleItem.time.split(/[-–]/).map(t => t.trim());

        // Check if there's already an existing REQUEST_TO_COMPLETE or PENDING doc
        const classesRef = collection(db, "classes");
        const q = query(
            classesRef,
            where("teacherUid", "==", teacherId),
            where("batch", "==", scheduleItem.batch),
            where("subject", "==", scheduleItem.subject),
            where("date", "==", normalizedDate)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
            // Update existing record
            const docId = snap.docs[0].id;
            const existingRef = doc(db, "classes", docId);
            const { updateDoc } = await import("firebase/firestore");
            await updateDoc(existingRef, {
                status: "COMPLETED",
                completedAt: serverTimestamp(),
                completedByUid: teacherId
            });
        } else {
            // Create a new record directly
            await addDoc(classesRef, {
                teacherUid: teacherId,
                teacherName: teacherName,
                date: normalizedDate,
                startTime: start || scheduleItem.time,
                endTime: end || "",
                timeRange: scheduleItem.time,
                batch: scheduleItem.batch,
                subject: scheduleItem.subject,
                status: "COMPLETED",
                completedByUid: teacherId,
                completedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
        }

        return true;
    } catch (error) {
        console.error("Error marking class complete:", error);
        throw error;
    }
};

/**
 * Fetch counts of completed classes grouped by batch and subject
 * Uses the dynamic 'batches' collection for active batches
 */
export const getBatchClassCounts = async () => {
    try {
        const classesRef = collection(db, "classes");
        const q = query(classesRef, where("status", "==", "COMPLETED"));
        const snapshot = await getDocs(q);

        const counts: Record<string, Record<string, number>> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const batch = data.batch;
            const subject = data.subject;

            if (batch && subject) {
                if (!counts[batch]) counts[batch] = {};
                counts[batch][subject] = (counts[batch][subject] || 0) + 1;
            }
        });

        // The hardcoded subjects dictated by the UI layout requirement
        const SUBJECTS = [
            "Sales",
            "Customer Service Excellence",
            "Career Planning & Branding",
            "Digital Marketing",
            "AI + Canva",
            "Business Management Tools (MS Office)",
            "Landing Page & Content Marketing",
            "English",
            "Dawah"
        ];

        // Format for the frontend
        const result: Record<string, { subjectName: string; classCount: number }[]> = {};

        // Fetch known active batches
        const allBatches = await getBatches();
        let activeBatches = allBatches.filter(b => b.status === "active").map(b => b.name);

        if (activeBatches.length === 0) {
            // Safe fallback to any batches that currently exist in the database, even if not explicitly "active", or use defaults
            const uniqueBatchesInDb = Object.keys(counts);
            if (uniqueBatchesInDb.length > 0) {
                 activeBatches = uniqueBatchesInDb;
            } else {
                 activeBatches = ["Batch_06", "Batch_07"];
            }
        }

        activeBatches.forEach(batch => {
            result[batch] = SUBJECTS.map(subj => ({
                subjectName: subj,
                classCount: counts[batch]?.[subj] || 0
            }));
        });

        return result;
    } catch (error) {
        console.error("Error fetching batch stats:", error);
        return {};
    }
};

// --- Batch Management Functions ---

export const getBatches = async (): Promise<BatchItem[]> => {
    try {
        const batchesRef = collection(db, "batches");
        const snapshot = await getDocs(batchesRef);
        const batches: BatchItem[] = [];
        snapshot.forEach(doc => {
            batches.push({ id: doc.id, ...doc.data() } as BatchItem);
        });
        return batches.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching batches:", error);
        return [];
    }
};

export const addBatch = async (name: string): Promise<boolean> => {
    try {
        await addDoc(collection(db, "batches"), {
            name: name.trim(),
            status: "active",
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error adding batch:", error);
        throw error;
    }
};

export const toggleBatchStatus = async (batchId: string, currentStatus: "active" | "archived"): Promise<boolean> => {
    try {
        const { updateDoc } = await import("firebase/firestore");
        const batchRef = doc(db, "batches", batchId);
        await updateDoc(batchRef, {
            status: currentStatus === "active" ? "archived" : "active"
        });
        return true;
    } catch (error) {
        console.error("Error toggling batch status:", error);
        throw error;
    }
};

/**
 * Fetch raw completed class data for CSV export
 */
export const getCompletedClassesByBatch = async (batchName: string) => {
    try {
        const classesRef = collection(db, "classes");
        const q = query(
            classesRef,
            where("batch", "==", batchName),
            where("status", "==", "COMPLETED")
        );
        const snapshot = await getDocs(q);
        const records: (FirestoreClass & { id: string })[] = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() } as FirestoreClass & { id: string });
        });
        // Sort effectively by date descending
        return records.sort((a, b) => (a.date > b.date ? -1 : 1));
    } catch (error) {
        console.error("Error fetching completed classes for export:", error);
        return [];
    }
};
