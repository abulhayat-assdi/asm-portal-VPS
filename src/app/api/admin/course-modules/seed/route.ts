export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { modulesData } from "@/data/modules";

const CARD_BULLETS: Record<string, string[]> = {
    "sales-mastery": [
        "Face-to-Face এবং অনলাইনে কনফিডেন্টলি প্রোডাক্ট সেল করার সাইকোলজি আয়ত্ত করা।",
        "কাস্টমারের যেকোনো অবজেকশন স্মার্টলি এবং পেশাদারিত্বের সাথে হ্যান্ডেল করা।",
        "কোনো বিরক্তিকর অ্যাপ্রোচ ছাড়াই B2B এবং B2C ডিল ক্র্যাক করার স্ট্র্যাটেজি।",
        "সেলসকে একটি 'আমানাহ' হিসেবে নিয়ে কাস্টমারের সাথে লং-টার্ম ট্রাস্ট বিল্ড করা।",
    ],
    "career-planning-branding": [
        "এমন একটি Winning CV তৈরি করা যা সহজেই ইন্টারভিউ কল নিয়ে আসবে।",
        "নিজেকে একটি পাওয়ারফুল Personal Brand হিসেবে এস্টাবলিশ করা।",
        "ইন্টারভিউ বোর্ডে 100% কনফিডেন্সের সাথে নিজেকে প্রেজেন্ট করার সিক্রেট হ্যাকস।",
        "নিজের ক্যারিয়ার বা অন্ট্রাপ্রেনিউরিয়াল জার্নির পুরো কন্ট্রোল নিজের হাতে নেওয়া।",
    ],
    "customer-service-excellence": [
        "রাগান্বিত কাস্টমারকেও আপনার ব্র্যান্ডের লয়্যাল ফ্যানে পরিণত করার সাইকোলজিক্যাল টেকনিক।",
        "Empathy এবং সবরের সাথে যেকোনো ডিফিকাল্ট সিচুয়েশন হ্যান্ডেল করা।",
        "প্রো-অ্যাকটিভ সাপোর্ট দিয়ে Client-এর সাথে স্ট্রং রিলেশনশিপ বিল্ড করা।",
        "কাস্টমার সার্ভিসের ক্ষেত্রে ইহসান (Excellence) এবং আদল (Fairness) নিশ্চিত করা।",
    ],
    "ai-for-digital-marketers": [
        "লেটেস্ট AI Tools ব্যবহার করে কাজের স্পিড এবং প্রোডাক্টিভিটি 10x বাড়িয়ে ফেলা।",
        "Canva মাস্টার করে আইক্যাচি ব্র্যান্ডিং এবং সোশ্যাল মিডিয়া অ্যাড ডিজাইন করা।",
        "বোরিং মার্কেটিং ওয়ার্কফ্লো অটোমেট করে স্ট্র্যাটেজি এবং ব্রেইনস্টর্মিংয়ে ফোকাস করা।",
        "কোনো ফেক হাইপ বা ধোঁকা ছাড়াই রেসপন্সিবিলিটির সাথে টেকনোলজি ইউজ করা।",
    ],
    "digital-marketing": [
        "ম্যাক্সিমাম ROI-এর জন্য Meta Ads (Facebook & Instagram) এর নাড়িভুঁড়ি আয়ত্ত করা।",
        "বিজনেস গ্রোথের জন্য স্ক্র্যাচ থেকে পাওয়ারফুল সোশ্যাল মিডিয়া স্ট্র্যাটেজি দাঁড় করানো।",
        "কমিউনিটি বিল্ড-আপ এবং রেফারেলের মাধ্যমে জেনুইন অর্গানিক গ্রোথ আনা।",
        "এথিক্যাল প্রমোশন এবং প্রিসাইজ অডিয়েন্স টার্গেটিংয়ের মাধ্যমে রিয়েল সঞ্চয় জেনারেট করা।",
    ],
    "business-management-tools": [
        "ডেটা ট্র্যাকিং, সেলস রিপোর্ট এবং অ্যানালিটিক্সের জন্য MS Excel-এ প্রো হয়ে ওঠা।",
        "MS Word ব্যবহার করে ফ্ললেস কর্পোরেট ডকুমেন্টেশন এবং প্রপোজাল রেডি করা।",
        "ইনভেস্টর বা ক্লায়েন্টকে ইমপ্রেস করতে MS PowerPoint-এ কিলার পিচ ডেক বানানো।",
        "কর্পোরেট ওয়ার্কফ্লো এবং ডেইলি টাস্কগুলো এফিশিয়েন্টলি এবং দ্রুত ম্যানেজ করা।",
    ],
    "landing-page-content-marketing": [
        "High-Converting Landing Page ডিজাইন করা যা ভিজিটরকে পেইং কাস্টমারে রূপান্তর করবে।",
        "100% সত্যতা বজায় রেখে ম্যাগনেটিক Copywriting করা যা ইজিলি সেলস আনাবে।",
        "অডিয়েন্সকে রিয়েল ভ্যালু প্রোভাইড করে এমন কিলার কন্টেন্ট স্ট্র্যাটেজি ডেভেলপ করা।",
        "A/B টেস্টিং এবং পারফরম্যান্স ট্র্যাকিংয়ের মাধ্যমে মার্কেটিং ক্যাম্পেইন স্কেল করা।",
    ],
    "business-english": [
        "পাবলিক স্পিকিংয়ের ভয় কাটিয়ে সবার সামনে কনফিডেন্টলি কথা বলা।",
        "ক্লায়েন্ট মিটিং বা জব ইন্টারভিউতে প্রফেশনাল ইংলিশে স্মার্টলি কমিউনিকেট করা।",
        "কর্পোরেট লেভেলের প্রফেশনাল ইমেইল লেখা যা দ্রুত রিপ্লাই নিয়ে আসবে।",
        "সেলস, মার্কেটিং এবং কর্পোরেট দুনিয়ার হাই-ভ্যালু ভোকাবুলারি আয়ত্ত করা।",
    ],
    "dawah-business-ethics": [
        "মার্কেটিংকে শুধুমাত্র প্রমোশন নয়, বরং সত্য ও 'দাওয়াহ' হিসেবে প্রেজেন্ট করা।",
        "বিজনেসের প্রতিদিনের ডিসিশনে ইখলাস (Sincerity) এবং শতভাগ সততা অ্যাপ্লাই করা।",
        "কর্পোরেট দুনিয়ার ফেক শর্টকাট এবং হারাম প্র্যাকটিসগুলো থেকে 100% দূরে থাকা।",
        "প্রফেশনাল সাকসেস এবং ইসলামিক ক্যারেক্টারের মধ্যে একটি পারফেক্ট ব্যালেন্স তৈরি করা।",
    ],
};

const SLUG_ORDER = [
    "sales-mastery",
    "career-planning-branding",
    "customer-service-excellence",
    "ai-for-digital-marketers",
    "digital-marketing",
    "business-management-tools",
    "landing-page-content-marketing",
    "business-english",
    "dawah-business-ethics",
];

export async function POST(req: NextRequest) {
    try {
        const caller = await getSessionUser(req);
        if (!caller || !isAdmin(caller)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // First check if the table exists using raw SQL
        const tableCheck = await prisma.$queryRaw<{ exists: boolean }[]>`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'course_modules'
            ) as exists
        `;

        if (!tableCheck[0]?.exists) {
            return NextResponse.json(
                {
                    error: "course_modules table does not exist. Please run the database migration first.",
                    fix: "Run: npx prisma migrate deploy  (on VPS)  OR  npx prisma migrate dev  (locally)",
                },
                { status: 500 }
            );
        }

        const results: string[] = [];

        for (let i = 0; i < SLUG_ORDER.length; i++) {
            const slug = SLUG_ORDER[i];
            const data = modulesData[slug];
            if (!data) continue;

            const bullets = CARD_BULLETS[slug] ?? [];
            const curriculum = data.modules;

            // Check if already exists
            const existing = await prisma.$queryRaw<{ id: string }[]>`
                SELECT id FROM course_modules WHERE slug = ${slug} LIMIT 1
            `;

            if (existing.length > 0) {
                results.push(`${slug}: skipped (already exists)`);
                continue;
            }

            // Insert using raw SQL to bypass prisma client model availability
            const id = `cm_${Date.now()}_${i}`;
            const now = new Date().toISOString();

            await prisma.$executeRaw`
                INSERT INTO course_modules (id, slug, title, description, pdf_link, bullets, curriculum, is_published, "order", created_at, updated_at)
                VALUES (
                    ${id},
                    ${slug},
                    ${data.title},
                    ${data.description},
                    ${""},
                    ${JSON.stringify(bullets)}::jsonb,
                    ${JSON.stringify(curriculum)}::jsonb,
                    ${true},
                    ${i},
                    ${now}::timestamptz,
                    ${now}::timestamptz
                )
            `;

            results.push(`${slug}: created`);
        }

        revalidatePath("/modules");
        return NextResponse.json({ results });
    } catch (error) {
        console.error("[CourseModules Seed] Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            {
                error: msg,
                hint: "If this is a 'table does not exist' error, run: npx prisma migrate deploy",
            },
            { status: 500 }
        );
    }
}
