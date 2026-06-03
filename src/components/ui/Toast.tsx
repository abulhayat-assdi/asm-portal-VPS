"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createContext, useContext } from "react";

// ─── Types ───────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, 0 = sticky
}

export interface ResultItem {
    text: string;
    status: "created" | "skipped" | "error";
}

interface ToastContextValue {
    toast: (opts: Omit<Toast, "id">) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    showResults: (title: string, items: ResultItem[]) => void;
    dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
}

// ─── Config ──────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const STYLES: Record<ToastType, { bg: string; icon: string; bar: string; title: string }> = {
    success: { bg: "bg-white border-emerald-200",  icon: "bg-emerald-100 text-emerald-600", bar: "bg-emerald-500", title: "text-emerald-800" },
    error:   { bg: "bg-white border-red-200",       icon: "bg-red-100 text-red-600",         bar: "bg-red-500",     title: "text-red-800"   },
    warning: { bg: "bg-white border-amber-200",     icon: "bg-amber-100 text-amber-600",     bar: "bg-amber-500",   title: "text-amber-800" },
    info:    { bg: "bg-white border-blue-200",      icon: "bg-blue-100 text-blue-600",       bar: "bg-blue-500",    title: "text-blue-800"  },
};

// ─── Single Toast Component ───────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const duration = toast.duration ?? 4000;
    const s = STYLES[toast.type];

    useEffect(() => {
        const show = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(show);
    }, []);

    useEffect(() => {
        if (duration === 0) return;
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining === 0) {
                clearInterval(interval);
                setVisible(false);
                setTimeout(() => onDismiss(toast.id), 300);
            }
        }, 16);
        return () => clearInterval(interval);
    }, [duration, toast.id, onDismiss]);

    return (
        <div
            className={`
                relative flex gap-3 items-start p-4 rounded-2xl border shadow-lg
                transition-all duration-300 ease-out w-full max-w-sm overflow-hidden
                ${s.bg}
                ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}
            `}
        >
            {/* Progress bar */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 rounded-full">
                    <div
                        className={`h-full rounded-full transition-none ${s.bar}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${s.icon}`}>
                {ICONS[toast.type]}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-sm font-semibold ${s.title}`}>{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
            </div>

            {/* Close */}
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onDismiss(toast.id), 300);
                }}
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// ─── Results Modal ────────────────────────────────────────────
function ResultsModal({
    title,
    items,
    onClose,
}: {
    title: string;
    items: ResultItem[];
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    const close = () => {
        setVisible(false);
        setTimeout(onClose, 200);
    };

    const created = items.filter(i => i.status === "created").length;
    const skipped = items.filter(i => i.status === "skipped").length;
    const errors  = items.filter(i => i.status === "error").length;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${visible ? "bg-black/40 backdrop-blur-sm" : "bg-transparent"}`}
            onClick={close}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transition-all duration-200 ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-800">{title}</h3>
                    </div>
                    <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Summary chips */}
                <div className="flex gap-2 px-6 py-3">
                    {created > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {created} created
                        </span>
                    )}
                    {skipped > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            {skipped} skipped
                        </span>
                    )}
                    {errors > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            {errors} error
                        </span>
                    )}
                </div>

                {/* Item list */}
                <div className="px-6 pb-2 max-h-72 overflow-y-auto space-y-1.5">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                                item.status === "created" ? "bg-emerald-50"
                                : item.status === "error"   ? "bg-red-50"
                                : "bg-gray-50"
                            }`}
                        >
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                item.status === "created" ? "bg-emerald-500"
                                : item.status === "error"   ? "bg-red-500"
                                : "bg-gray-300"
                            }`}>
                                {item.status === "created" ? (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : item.status === "error" ? (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
                                    </svg>
                                )}
                            </span>
                            <span className={`font-medium ${
                                item.status === "created" ? "text-emerald-800"
                                : item.status === "error"   ? "text-red-800"
                                : "text-gray-500"
                            }`}>
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={close}
                        className="w-full py-2.5 bg-[#059669] text-white text-sm font-semibold rounded-xl hover:bg-[#047857] transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts]     = useState<Toast[]>([]);
    const [results, setResults]   = useState<{ title: string; items: ResultItem[] } | null>(null);
    const counterRef              = useRef(0);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((opts: Omit<Toast, "id">) => {
        const id = `toast_${++counterRef.current}`;
        setToasts(prev => [...prev, { ...opts, id }]);
    }, []);

    const success  = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
    const error    = useCallback((title: string, message?: string) => toast({ type: "error",   title, message, duration: 6000 }), [toast]);
    const warning  = useCallback((title: string, message?: string) => toast({ type: "warning", title, message, duration: 5000 }), [toast]);
    const info     = useCallback((title: string, message?: string) => toast({ type: "info",    title, message }), [toast]);

    const showResults = useCallback((title: string, items: ResultItem[]) => {
        setResults({ title, items });
    }, []);

    return (
        <ToastContext.Provider value={{ toast, success, error, warning, info, showResults, dismiss }}>
            {children}

            {/* Toast stack — top-right */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none w-80">
                {toasts.map(t => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem toast={t} onDismiss={dismiss} />
                    </div>
                ))}
            </div>

            {/* Results modal */}
            {results && (
                <ResultsModal
                    title={results.title}
                    items={results.items}
                    onClose={() => setResults(null)}
                />
            )}
        </ToastContext.Provider>
    );
}
