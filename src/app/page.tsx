export const dynamic = "force-static";

import HeroSection from "@/components/ui/HeroSection";
import LearningOutcomes from "@/components/ui/LearningOutcomes";
import TargetAudience from "@/components/ui/TargetAudience";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

// Moved outside component to avoid recreation and support Server Component
const navLinks = [
    { label: "Home", href: "/", isActive: true },
    { label: "About", href: "/about" },
    { label: "Module", href: "/modules" },
    { label: "Instructors", href: "/instructors" },
    { label: "Success Stories", href: "/success-stories" },
    { label: "Contact & Q&A", href: "/contact" },
    { label: "Blog", href: "/blog" },
];

const learningOutcomes = [
    "100% সততা বজায় রেখে Face-to-Face এবং অনলাইনে কনফিডেন্টলি প্রোডাক্ট পিচ ও সেল করা।",
    "বিজনেসের গ্রোথ বুস্ট করতে রেসপন্সিবিলিটির সাথে AI Tools, Canva এবং Meta Ads মাস্টারি।",
    "Customer-এর চয়েসকে রেসপেক্ট করে পারসুয়েসিভ কমিউনিকেশন এবং যেকোনো অবজেকশন স্মার্টলি হ্যান্ডেল করা।",
    "কোনো ফেক প্রমিস বা ক্লিকবেইটের ফাঁদ ছাড়া, একদম জেনুইন ভ্যালু দিয়ে High-Converting Digital Marketing ক্যাম্পেইন ডিজাইন ও এক্সিকিউট করা।",
    "নিজের ইন্টিগ্রিটি বজায় রেখে একটি প্রফেশনাল CV, পোর্টফোলিও এবং স্ট্রং Personal Brand বিল্ড করা।",
    "প্রতিদিনের বিজনেস ডিসিশন ও ওয়ার্কপ্লেস বিহেভিয়ারে ইসলামিক এথিক্স (Amanah, Adl, Ikhlas) অ্যাপ্লাই করা।",
    "বিজনেস ডেটা ম্যানেজ এবং প্রফেশনাল কমিউনিকেশনের জন্য Business Management Tools (MS Office) অ্যাপ্লিকেশনে প্রো-লেভেলের দক্ষতা অর্জন।",
    "Customer ও Client-কে রিয়েল ভ্যালু প্রোভাইড করে এমন হাইলি এঙ্গেজিং Landing Page এবং Content Marketing স্ট্র্যাটেজি ডেভেলপ করা।",
];

const audiences = [
    {
        iconKey: "students",
        title: "Students",
        description: "যারা শুধু পুঁথিগত বিদ্যায় আটকে না থেকে রিয়েল-ওয়ার্ল্ডের জন্য রেডি হতে চায়। কথা বলার জড়তা কাটিয়ে Practical Skills ও সেলফ-কনফিডেন্স দিয়ে ক্যারিয়ারের একটি স্ট্রং ফাউন্ডেশন গড়তে চায়।",
    },
    {
        iconKey: "jobSeekers",
        title: "Job Seekers",
        description: "যারা কনফিডেন্ট কমিউনিকেশন এবং High-Demanding Skills দিয়ে জব ইন্টারভিউতে নিজেকে বেস্ট প্রমাণ করতে চায়। আজকের এই কম্পিটিটিভ মার্কেটে একটি সম্মানজনক ক্যারিয়ার কনফার্ম করতে চায়।",
    },
    {
        iconKey: "entrepreneurs",
        title: "Entrepreneurs",
        description: "যারা প্র্যাকটিক্যাল অফলাইন এবং অনলাইন সেলস স্ট্র্যাটেজি মাস্টার করে নিজেদের বিজনেস Scale Up করতে চায়। আর কাস্টমারদের সাথে লং-টার্ম ট্রাস্ট এবং স্ট্রং রিলেশনশিপ বিল্ড করতে চায়।",
    },
    {
        iconKey: "ethicalLearners",
        title: "Ethical Learners",
        description: "যারা সেলসকে 'আমানাহ' (Trust) হিসেবে নিতে চায়। কোনো ফেক প্রমিস, ম্যানিপুলেশন বা হারাম শর্টকাটের ফাঁদে না পড়ে, 100% সততা ও সম্মানের সাথে হালাল ইনকাম জেনারেট করতে চায়।",
    },
];

const footerLinkGroups = [
    {
        title: "Navigation",
        links: [
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Module", href: "/modules" },
            { label: "Instructors", href: "/instructors" },
        ],
    },
    {
        title: "Support",
        links: [
            { label: "Success Stories", href: "/success-stories" },
            { label: "Contact & Q&A", href: "/contact" },
            { label: "Enroll / Learn More", href: "/enroll" },
        ],
    },
];

export default function HomePage() {
    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
                ctaHref="/enroll"
                secondaryCtaText="Login as Teacher"
                secondaryCtaHref="/login"
                studentLoginHref="/student-login"
                transparent={true}
            />
            <main className="min-h-screen bg-white">
                <HeroSection
                    heading="The Art of Sales & Marketing"
                    subheading=""
                    primaryButtonText="Learn About the Course"
                    secondaryButtonText="View Modules"
                    primaryButtonHref="/about"
                    secondaryButtonHref="/modules"
                />

                <TargetAudience
                    title="Who This Course Is For"
                    subtitle="ক্যারিয়ার বা বিজনেসে যারা নিজেকে একজন Confident এবং Ethical Professional হিসেবে এস্টাবলিশ করতে চায় এবং 100% হালাল ইনকামের পথ নিশ্চিত করতে চায়।"
                    audiences={audiences}
                />

                <LearningOutcomes
                    title="What You Will Gain"
                    subtitle="আজকের কম্পিটিটিভ মার্কেটে লিড দেওয়ার জন্য Practical Skills, Digital Expertise এবং একটি স্ট্রং Ethical Mindset।"
                    outcomes={learningOutcomes}
                />
            </main>
            <Footer
                brandName="Sales & Marketing"
                brandDescription="A professional learning platform focused on practical sales, marketing, and ethical growth."
                linkGroups={footerLinkGroups}
                copyrightText="© 2026 Sales & Marketing. All rights reserved."
            />
        </>
    );
}
