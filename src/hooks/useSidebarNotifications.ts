"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getCountFromServer, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// Define how to track notifications for each sidebar path
const NOTIFICATION_CONFIGS = [
    {
        path: "/dashboard/homework",
        collectionName: "homework_submissions",
        timestampField: "submittedAt",
        roles: ["teacher", "admin"],
        getExtraConstraints: (userProfile: any) => {
            // Teacher only sees homework assigned to them
            if (userProfile?.role === "teacher") {
                return [where("teacherName", "==", userProfile.displayName)];
            }
            return [];
        }
    },
    {
        path: "/dashboard/admin/manage-homework",
        collectionName: "homework_submissions",
        timestampField: "submittedAt",
        roles: ["admin"],
    },
    {
        path: "/dashboard/admin/contact-messages",
        collectionName: "contact_messages",
        roles: ["admin"],
        // For contact messages, we don't rely only on timestamp. 
        // We can just count all "unread", but to be accurate with LastVisited, 
        // we'll count ones created after last visit, or just all unread.
        // Let's just track all unread regardless of last visit because unread is an explicit state.
        isExplicitUnread: true,
        getExtraConstraints: () => [where("status", "==", "unread")]
    },
    {
        path: "/dashboard/feedback",
        collectionName: "feedback",
        timestampField: "createdAt",
        roles: ["admin"], // Admin only to prevent teacher permission errors
    },
    {
        path: "/dashboard/tracker",
        collectionName: "daily_tracker_reports", // Corrected collection name
        timestampField: "createdAt",
        roles: ["admin"], // Admin only per firestore.rules
    },
];

export function useSidebarNotifications() {
    const { userProfile, loading } = useAuth();
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [trigger, setTrigger] = useState(0);

    // Function to force a refetch if needed
    const refreshNotifications = useCallback(() => setTrigger(prev => prev + 1), []);

    // Call this when user navigates to a tracked page
    const markPageAsVisited = useCallback((path: string) => {
        if (typeof window !== "undefined") {
            const now = Date.now();
            localStorage.setItem(`lastVisited_${path}`, now.toString());
            // Immediately clear the count for this path in the UI
            setCounts(prev => ({ ...prev, [path]: 0 }));
            refreshNotifications();
        }
    }, [refreshNotifications]);

    useEffect(() => {
        if (loading || !userProfile || !userProfile.role) return;
        let isMounted = true;

        const fetchCounts = async () => {
            const newCounts: Record<string, number> = {};

            // Default to Date.now() - 24 hours (86400000 ms) if no lastVisited found,
            // to show items from the last day automatically instead of thousands of old items.
            const DEFAULT_VISIT_MS = Date.now() - 24 * 60 * 60 * 1000; 

            const fetchPromises = NOTIFICATION_CONFIGS.map(async (config) => {
                // Check if role has access
                if (!config.roles.includes(userProfile.role)) return;

                let lastVisitedMs = DEFAULT_VISIT_MS;
                if (typeof window !== "undefined") {
                    const stored = localStorage.getItem(`lastVisited_${config.path}`);
                    if (stored) {
                        lastVisitedMs = parseInt(stored, 10);
                    }
                }

                try {
                    const constraints = config.getExtraConstraints ? config.getExtraConstraints(userProfile) : [];

                    if (config.isExplicitUnread) {
                        // Just count all explicit unreads
                        const q = query(collection(db, config.collectionName), ...constraints);
                        const snapshot = await getCountFromServer(q);
                        newCounts[config.path] = snapshot.data().count;
                    } else if (config.timestampField) {
                        const lastVisitedTimestamp = Timestamp.fromMillis(lastVisitedMs);

                        if (constraints.length > 0) {
                            // To avoid composite index requirement:
                            // Fetch with extra constraints first, then filter by timestamp in-memory
                            const { getDocs: getDocsFn } = await import("firebase/firestore");
                            const q = query(collection(db, config.collectionName), ...constraints);
                            const snapshot = await getDocsFn(q);
                            const count = snapshot.docs.filter(d => {
                                const ts = d.data()[config.timestampField!];
                                return ts && ts.toMillis && ts.toMillis() > lastVisitedMs;
                            }).length;
                            newCounts[config.path] = count;
                        } else {
                            // No extra constraints — single where is fine, no composite index needed
                            const q = query(
                                collection(db, config.collectionName),
                                where(config.timestampField, ">", lastVisitedTimestamp)
                            );
                            const snapshot = await getCountFromServer(q);
                            newCounts[config.path] = snapshot.data().count;
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching notification count for ${config.path}:`, error);
                    newCounts[config.path] = 0;
                }
            });

            await Promise.allSettled(fetchPromises);
            if (isMounted) {
                setCounts(newCounts);
            }
        };

        fetchCounts();

        // Optionally re-fetch periodically every 5 minutes
        const interval = setInterval(fetchCounts, 5 * 60 * 1000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [userProfile, loading, trigger]);

    return { counts, markPageAsVisited, refreshNotifications };
}
