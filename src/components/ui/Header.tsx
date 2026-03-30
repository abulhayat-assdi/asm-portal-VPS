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
                "w-full transition-all duration-300 z-50 px-4 pt-4 sm:px-6 lg:px-8",
                transparent
                    ? "fixed top-0"
                    : "sticky top-0",
                className
            )}
        >
            <div className={cn(
                "max-w-7xl mx-auto px-4 lg:px-6 rounded-md md:rounded-full border border-gray-200 shadow-sm transition-colors duration-300",
                isTransparent 
                    ? "bg-white/90 backdrop-blur-md" 
                    : "bg-[#e5e7eb]"
            )}>
                <div className="flex items-center justify-between h-20">
                    {/* Left - Brand */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="bg-[#0D1B2A] rounded-xl p-1.5 flex lg:hidden">
                            <BrandLogo size={28} primaryColor="#FFFFFF" arrowColor="#4CAF50" />
                        </div>
                        <div className="bg-[#0D1B2A] rounded-xl p-1.5 hidden lg:block">
                            <BrandLogo size={32} primaryColor="#FFFFFF" arrowColor="#4CAF50" />
                        </div>
                        <span className={cn(
                            "hidden md:block text-lg font-bold transition-colors text-[#1f2937]"
                        )}>
                            {brandText}
                        </span>
                    </Link>

                    {/* Desktop Navigation - Centered */}
                    <nav className="hidden lg:flex items-center justify-center flex-1 gap-6 mx-4">
                        {navLinks.map((link, index) => (
                            <Link
                                key={index}
                                href={link.href}
                                className={cn(
                                    "text-sm font-semibold transition-all duration-200 ease-out py-6 border-b-2 relative top-[1px]",
                                    link.isActive
                                        ? "text-[#059669] border-[#059669]"
                                        : "text-[#374151] border-transparent hover:text-[#059669] hover:border-[#059669]/50"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Components */}
                    <div className="hidden lg:flex items-center gap-2 md:gap-3">

                        <button
                            onClick={() => router.push('/student-login')}
                            className="px-5 py-2.5 text-sm font-bold/90 rounded-md bg-white text-[#059669] border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200 ease-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#059669]"
                        >
                            Login as Student
                        </button>

                        {/* Secondary CTA - Login as Teacher */}
                        {secondaryCtaText && (
                            <button
                                onClick={handleSecondaryClick}
                                className="px-5 py-2.5 text-sm font-bold/90 rounded-md bg-white text-[#059669] border border-gray-200 hover:bg-gray-50 shadow-sm transition-all duration-200 ease-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#059669]"
                            >
                                {secondaryCtaText}
                            </button>
                        )}

                        {/* Primary CTA */}
                        <button
                            onClick={handleCtaClick}
                            className="px-5 py-2.5 text-sm font-bold rounded-md bg-[#059669] text-white hover:bg-[#047857] shadow-sm transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#059669]"
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
                                ? "text-[#4CAF50] hover:bg-[#4CAF50]/10"
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
                                    router.push('/student-login');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full px-6 py-3.5 bg-white text-[#059669] border border-[#059669] text-base font-bold rounded-full
                                transition-all duration-200 ease-out
                                hover:bg-[#f0fdf4]
                                focus:outline-none focus:ring-2 focus:ring-[#059669] focus:ring-offset-2"
                            >
                                Login as Student
                            </button>
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
