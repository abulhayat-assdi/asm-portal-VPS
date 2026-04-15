import { cn, getBadgeColor } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "error" | "info";
    className?: string;
    size?: "sm" | "md" | "lg";
}

export default function Badge({
    children,
    variant = "default",
    className = "",
    size = "md",
}: BadgeProps) {
    const sizes = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center font-medium rounded-full",
                getBadgeColor(variant),
                sizes[size],
                className
            )}
        >
            {children}
        </span>
    );
}
