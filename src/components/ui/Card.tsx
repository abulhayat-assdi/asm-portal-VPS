import { cn } from "@/lib/utils";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export default function Card({ children, className = "", hover = false }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-xl shadow-sm border border-[#e5e7eb]",
                hover && "hover:shadow-md transition-shadow duration-200",
                className
            )}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
    return (
        <div className={cn("px-6 py-4 border-b border-[#e5e7eb]", className)}>
            {children}
        </div>
    );
}

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
    return <div className={cn("p-6", className)}>{children}</div>;
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
    return (
        <div className={cn("px-6 py-4 border-t border-[#e5e7eb] bg-[#f9fafb]", className)}>
            {children}
        </div>
    );
}
