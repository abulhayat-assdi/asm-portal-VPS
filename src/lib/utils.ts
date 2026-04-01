// Utility functions for the Internal Web Portal

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    return date.toLocaleDateString("bn-BD", options);
}

/**
 * Format date in short format (DD/MM/YYYY)
 */
export function formatDateShort(dateString: string): string {
    if (!dateString) return "";

    // Check if already in DD/MM/YYYY or D/M/YYYY
    const dmyMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Get badge color classes based on variant (Brand Theme)
 */
export function getBadgeColor(
    variant: "default" | "success" | "warning" | "error" | "info"
): string {
    const colors = {
        default: "bg-[#d1fae5] text-[#059669]",
        success: "bg-[#10b981] text-white",
        warning: "bg-[#f59e0b] text-white",
        error: "bg-[#ef4444] text-white",
        info: "bg-[#3b82f6] text-white",
    };
    return colors[variant];
}

/**
 * Get status badge variant based on status text
 */
export function getStatusVariant(status: string): "success" | "warning" | "error" | "info" | "default" {
    const statusLower = status.toLowerCase();

    if (statusLower === "active" || statusLower === "completed" || statusLower === "seen") {
        return "success";
    } else if (statusLower === "pending" || statusLower === "today") {
        return "warning";
    } else if (statusLower === "inactive" || statusLower === "cancelled") {
        return "error";
    } else if (statusLower === "urgent" || statusLower === "important") {
        return "error";
    }

    return "default";
}

/**
 * Get notice type badge variant
 */
export function getNoticeTypeVariant(type: string): "success" | "warning" | "error" | "info" | "default" {
    const typeLower = type.toLowerCase();

    if (typeLower === "urgent") {
        return "error";
    } else if (typeLower === "important") {
        return "warning";
    }

    return "info";
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

/**
 * Get initials from name for avatar
 */
export function getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Utility to combine class names (similar to clsx)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}
