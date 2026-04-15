import { cn } from "@/lib/utils";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export default function Button({
    children,
    onClick,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    type = "button",
}: ButtonProps) {
    const baseStyles = "font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "bg-[#059669] text-white hover:bg-[#10b981] focus:ring-[#059669]",
        secondary: "bg-[#6b7280] text-white hover:bg-[#4b5563] focus:ring-[#6b7280]",
        outline: "border-2 border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-white focus:ring-[#059669]",
        ghost: "text-[#1f2937] hover:bg-[#f3f4f6] focus:ring-[#e5e7eb]",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    const disabledStyles = "opacity-50 cursor-not-allowed";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                disabled && disabledStyles,
                className
            )}
        >
            {children}
        </button>
    );
}
