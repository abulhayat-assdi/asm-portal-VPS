"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/ui/BrandLogo";

interface NavLink {
    label: string;
    href: string;
    isActive?: boolean;
}

interface HeaderProps {
    brandText?: string;
    navLinks: NavLink[];
    ctaText: string;
    onCtaClick?: () => void;
    secondaryCtaText?: string;
    onSecondaryCtaClick?: () => void;
    onBrandClick?: () => void;
    className?: string;
}

export default function Header({
    brandText = "Sales & Marketing",
    navLinks,
    ctaText,
    onCtaClick,
    secondaryCtaText = "Login as Teacher",
    onSecondaryCtaClick,
    onBrandClick,
    className = "",
    transparent = false,
}: HeaderProps & { transparent?: boolean }) {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isTransparent = transparent && !isScrolled;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSecondaryClick = onSecondaryCtaClick || (() => router.push('/login'));

    // Default handler for Enroll button if onCtaClick is not provided
    const handleCtaClick = onCtaClick || (() => {
        if (ctaText === "Enroll") {
            router.push('/enroll');
        }
    });


    return (
        <header
            className={cn(
                "w-full transition-all duration-300 z-50",
                transparent
                    ? "fixed top-0"
                    : "sticky top-0 bg-white border-b border-[#e5e7eb]",
                isTransparent
                    ? "bg-transparent border-transparent py-4"
                    : transparent
                        ? "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-2" // Glass state when scrolled
                        : "", // Default state handled above
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left - Brand */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        {/* Logo Icon — dark pill so white logo is always visible */}
                        <div className="bg-[#0D1B2A] rounded-xl p-1.5">
                            <BrandLogo size={38} primaryColor="#FFFFFF" arrowColor="#4CAF50" />
                        </div>
                        <span className={cn(
                            "text-lg font-semibold transition-colors",
                            isTransparent ? "text-white" : "text-[#1f2937]"
                        )}>
                            {brandText}
                        </span>
                    </Link>


                    {/* Desktop Navigation - Centered */}
                    <nav className="hidden lg:flex items-center justify-center flex-1 gap-6 mx-8">
                        {navLinks.map((link, index) => (
                            <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium transition-colors duration-200 ease-out",
                                    link.isActive
                                        ? isTransparent
                                            ? "text-[#4CAF50]"
                                            : "text-[#4CAF50]"
                                        : isTransparent
                                            ? "text-white/90 hover:text-white"
                                            : "text-[#4b5563] hover:text-[#4CAF50]"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden lg:flex items-center gap-3">
                        {/* Secondary CTA - made text-only or subtle for header to reduce noise, or keep as button if needed. 
                            Keeping as button but checking style. */}
                        {secondaryCtaText && (
                            <button
                                onClick={handleSecondaryClick}
                                className={cn(
                                    "px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 ease-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2",
                                    isTransparent
                                        ? "bg-transparent text-white border border-white/40 hover:bg-white/10 hover:border-white focus:ring-white"
                                        : "bg-transparent text-[#4CAF50] border border-[#4CAF50] hover:bg-[#F1F8E9] focus:ring-[#4CAF50]"
                                )}
                            >
                                {secondaryCtaText}
                            </button>
                        )}
                        <button
                            onClick={handleCtaClick}
                            className={cn(
                                "px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 ease-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2",
                                isTransparent
                                    ? "bg-[#4CAF50] text-white hover:bg-[#43A047] focus:ring-[#4CAF50]" // Green even on transparent
                                    : "bg-[#4CAF50] text-white hover:bg-[#43A047] focus:ring-[#4CAF50]"
                            )}
                        >
                            {ctaText}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={cn(
                            "lg:hidden p-2 rounded-lg transition-colors",
                            isTransparent
                                ? "text-white hover:bg-white/10"
                                : "text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f3f4f6]"
                        )}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-[#e5e7eb] absolute top-full left-0 w-full bg-white shadow-xl px-4 rounded-b-2xl">
                        <nav className="flex flex-col gap-2 mb-4">
                            {navLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    className={cn(
                                        "px-5 py-3 text-base font-semibold rounded-full border transition-all duration-200 ease-out",
                                        link.isActive
                                            ? "text-[#059669] bg-[#f0fdf4] border-[#dcfce7]"
                                            : "text-[#1f2937] bg-white border-[#e5e7eb] hover:bg-[#f0fdf4] hover:border-[#dcfce7]"
                                    )}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    handleCtaClick();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full px-6 py-3.5 bg-[#059669] text-white text-base font-bold rounded-full
                                transition-all duration-200 ease-out
                                hover:bg-[#10b981]
                                focus:outline-none focus:ring-2 focus:ring-[#059669] focus:ring-offset-2"
                            >
                                {ctaText}
                            </button>
                            {secondaryCtaText && (
                                <button
                                    onClick={() => {
                                        handleSecondaryClick();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full px-6 py-3.5 bg-white text-[#059669] border border-[#059669] text-base font-bold rounded-full
                                    transition-all duration-200 ease-out
                                    hover:bg-[#f0fdf4]
                                    focus:outline-none focus:ring-2 focus:ring-[#059669] focus:ring-offset-2"
                                >
                                    {secondaryCtaText}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
