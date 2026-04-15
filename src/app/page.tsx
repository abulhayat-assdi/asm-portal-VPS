import HeroSection from "@/components/ui/HeroSection";
import StudentVideoTestimonials from "@/components/ui/StudentVideoTestimonials";
import TargetAudience from "@/components/ui/TargetAudience";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

// Static data for the page
const navLinks = [
    { label: "Home", href: "/", isActive: true },
    { label: "About", href: "/about" },
    { label: "Module", href: "/modules" },
    { label: "Instructors", href: "/instructors" },
    { label: "Success Stories", href: "/success-stories" },
    { label: "Contact & Q&A", href: "/contact" },
    { label: "Blog", href: "/blog" },
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
            <main className="min-h-screen bg-slate-50">
                <HeroSection
                    primaryButtonHref="/about"
                    secondaryButtonHref="/modules"
                />

                <TargetAudience
                    title="Who This Course Is For"
                    subtitle="ক্যারিয়ার বা বিজনেসে যারা নিজেকে একজন Confident এবং Ethical Professional হিসেবে এস্টাবলিশ করতে চায় এবং 100% হালাল ইনকামের পথ নিশ্চিত করতে চায়।"
                    audiences={audiences}
                />

                <StudentVideoTestimonials />
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
