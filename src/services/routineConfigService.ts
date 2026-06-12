export interface CustomCategory {
    id: string;
    label: string;
    keywords: string; // comma-separated, e.g. "sales,mkt,marketing"
    color: string;    // hex color, e.g. "#2563EB"
    count?: string;   // admin-entered number of classes for this topic (legend)
}

export interface RoutineConfig {
    id?: string;
    batch: string;
    title: string;
    subtitle: string;
    footerText: string;
    hiddenCategories: string[];
    customCategories: CustomCategory[];
}

export const DEFAULT_CATEGORIES: CustomCategory[] = [
    { id: "sales",   label: "Sales & Mkt. / Lab", keywords: "sales,mkt,marketing,lab",          color: "#2563EB" },
    { id: "dawah",   label: "Dawah Class",         keywords: "dawah",                             color: "#16A34A" },
    { id: "content", label: "Content Mkt.",         keywords: "content",                           color: "#EC4899" },
    { id: "office",  label: "MS Office",            keywords: "ms office,office",                  color: "#D97706" },
    { id: "study",   label: "Study Practice",       keywords: "study practice,study",              color: "#7C3AED" },
    { id: "english", label: "English Class",        keywords: "english",                           color: "#0284C7" },
    { id: "landing", label: "Landing Page",         keywords: "landing page,landing",              color: "#0891B2" },
    { id: "guest",   label: "Guest Session",        keywords: "guest session,guest,expert",        color: "#4338CA" },
    { id: "brand",   label: "Branding",             keywords: "branding",                          color: "#9333EA" },
    { id: "sports",  label: "Sports & Rec.",        keywords: "sports,rec,recreational",           color: "#DC2626" },
    { id: "field",   label: "Field Practical",      keywords: "field practical,field",             color: "#F59E0B" },
    { id: "quran",   label: "Quran Class",          keywords: "quran,qur",                         color: "#10B981" },
];

const empty = (): RoutineConfig => ({
    batch: "", title: "", subtitle: "", footerText: "",
    hiddenCategories: [], customCategories: [],
});

export const getRoutineConfig = async (batchName: string): Promise<RoutineConfig> => {
    try {
        const res = await fetch(`/api/routine-config?batch=${encodeURIComponent(batchName)}`, { cache: "no-store" });
        if (!res.ok) return { ...empty(), batch: batchName };
        return res.json();
    } catch {
        return { ...empty(), batch: batchName };
    }
};

export const saveRoutineConfig = async (config: RoutineConfig): Promise<void> => {
    const res = await fetch("/api/routine-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save routine config.");
    }
};
