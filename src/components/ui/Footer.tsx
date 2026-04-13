"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";

interface FooterLinkGroup {
    title: string;
    links: { label: string; href: string }[];
}

interface FooterProps {
    brandName?: string;
    brandDescription?: string;
    linkGroups: FooterLinkGroup[];
    copyrightText: string;
    className?: string;
}

export default function Footer({
    brandName = "Sales & Marketing",
    brandDescription = "A professional learning platform focused on practical sales, marketing, and ethical growth.",
    linkGroups,
    copyrightText,
    className = "",
}: FooterProps) {
    return (
        <footer
            className={cn(
                "w-full bg-[#0B1120] border-t border-gray-800", // Dark premium background
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Top Section */}
                <div className="py-12 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
                        {/* Brand Block */}
                        <div className="lg:col-span-5">
                            <div className="flex items-center gap-2 mb-4">
                                {/* Logo Icon */}
                                <BrandLogo size={40} primaryColor="#FFFFFF" arrowColor="#4CAF50" />
                                <span className="text-lg font-semibold text-white">
                                    {brandName}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                                {brandDescription}
                            </p>
                        </div>

                        {/* Link Groups */}
                        <div className="lg:col-span-7">
                            <div className="grid grid-cols-2 gap-8">
                                {linkGroups.map((group, index) => (
                                    <div key={index}>
                                        <h4 className="no-gradient text-sm font-semibold text-white mb-4">
                                            {group.title}
                                        </h4>
                                        <ul className="space-y-3">
                                            {group.links.map((link, linkIndex) => (
                                                <li key={linkIndex}>
                                                    <Link
                                                        href={link.href}
                                                        prefetch={true}
                                                        className="text-sm text-gray-400 hover:text-[#4CAF50] transition-colors"
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="py-6 border-t border-gray-800">
                    <p className="text-sm text-gray-500 text-center">
                        {copyrightText}
                    </p>
                </div>
            </div>
        </footer>
    );
}
