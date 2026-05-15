"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
    const resolveRef = useRef<((val: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
        const opts: ConfirmOptions = typeof options === "string" ? { message: options } : options;
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setState({ ...opts, open: true });
        });
    }, []);

    const handleResponse = (result: boolean) => {
        setState(null);
        resolveRef.current?.(result);
        resolveRef.current = null;
    };

    const variantStyles = {
        danger: {
            icon: (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            ),
            confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
        },
        warning: {
            icon: (
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            ),
            confirmBtn: "bg-yellow-500 hover:bg-yellow-600 text-white",
        },
        info: {
            icon: (
                <div className="w-12 h-12 rounded-full bg-[#e6f4ef] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            ),
            confirmBtn: "bg-[#059669] hover:bg-[#047857] text-white",
        },
    };

    const variant = state?.variant ?? "danger";
    const styles = variantStyles[variant];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {state?.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => handleResponse(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        {styles.icon}

                        <h3 className="text-lg font-bold text-[#1f2937] text-center mb-2">
                            {state.title ?? (variant === "danger" ? "নিশ্চিত করুন" : "নিশ্চিত করুন")}
                        </h3>

                        <p className="text-sm text-[#6b7280] text-center mb-6 leading-relaxed whitespace-pre-line">
                            {state.message}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleResponse(false)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                {state.cancelText ?? "বাতিল"}
                            </button>
                            <button
                                onClick={() => handleResponse(true)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${styles.confirmBtn}`}
                            >
                                {state.confirmText ?? "হ্যাঁ, নিশ্চিত"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
    return ctx.confirm;
}
