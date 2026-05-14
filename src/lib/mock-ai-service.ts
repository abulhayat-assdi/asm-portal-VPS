/**
 * AI Service — Simplified Mock Service
 * Replaces Firebase AI SDK with local keyword-based matching.
 * This version removes all Firebase dependencies.
 */

// কোর্স সম্পর্কিত system prompt (kept for future reference or different AI implementation)
const SYSTEM_PROMPT = `You are the official AI Admission Counselor and Virtual Assistant for "The Art of Sales & Marketing"...`;

// Smart fallback responses
const FALLBACK_RESPONSES: { keywords: string[]; response: string }[] = [
    {
        keywords: ["price", "cost", "fee", "দাম", "মূল্য", "টাকা", "কত"],
        response: "কোর্সের মোট ফি ৭০,০০০ টাকা। এর মধ্যে ভর্তি ফি ১০,০০০ টাকা দেওয়া বাধ্যতামূলক এবং বাকি কোর্স ফি ও আবাসন ফি ৬০,০০০ টাকা। আর্থিক অস্বচ্ছলতার প্রমাণ সাপেক্ষে ১০০% পর্যন্ত স্কলারশিপ প্রদান করা হয়।",
    },
    {
        keywords: ["duration", "long", "week", "month", "সময়", "কয়", "কতদিন", "মাস", "সপ্তাহ"],
        response: "এটি পুরুষদের জন্য একটি ৯০ দিনের আবাসিক কোর্স। এই সময়ে আপনাকে প্র্যাকটিক্যাল স্কিলস এবং প্রফেশনাল ট্রেনিং প্রদান করা হবে।",
    },
    {
        keywords: ["beginner", "start", "experience", "নতুন", "শুরু", "অভিজ্ঞতা", "পারব", "স্টুডেন্ট", "student", "job", "চাকরি"],
        response: "এই কোর্সটি সবার জন্য উন্মুক্ত। স্টুডেন্ট, জব সিকার অথবা এন্টারপ্রেনার—যারাই রিয়েল-ওয়ার্ল্ড স্কিলস ডেভেলপ করতে চান, তারা কোনো পূর্ব অভিজ্ঞতা ছাড়াই অংশগ্রহণ করতে পারবেন। আমরা ফাউন্ডেশন থেকে শুরু করে প্রফেশনাল লেভেল পর্যন্ত মেন্টরশিপ প্রদান করি।",
    },
    {
        keywords: ["certificate", "certification", "সার্টিফিকেট"],
        response: "কোর্স সফলভাবে সম্পন্ন করলে আপনি আস-সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউটটের অফিশিয়াল প্রফেশনাল সার্টিফিকেট পাবেন, যা আপনার সিভি এবং ক্যারিয়ার প্রোফাইলের ভ্যালু বৃদ্ধি করবে।",
    },
    {
        keywords: ["scholarship", "বৃত্তি", "স্কলারশিপ", "discount", "ছাড়"],
        response: "আমাদের কোর্সে আর্থিক অস্বচ্ছলতার প্রমাণ সাপেক্ষে ১০০% পর্যন্ত স্কলারশিপের অপশন রয়েছে। যোগ্য প্রার্থীরা সম্পূর্ণ কোর্স এবং আবাসন সুবিধা স্কলারশিপের আওতায় সম্পন্ন করতে পারবেন।",
    },
    {
        keywords: ["instructor", "teacher", "শিক্ষক", "প্রশিক্ষক", "কে পড়াবেন", "mentor", "মেন্টর"],
        response: "এই কোর্সটি পরিচালনা করবেন ইন্ডাস্ট্রির অভিজ্ঞ এবং প্রফেশনাল এক্সপার্টগণ। তারা তাদের রিয়েল-ওয়ার্ল্ড কর্পোরেট এক্সপেরিয়েন্স এবং প্র্যাকটিক্যাল নলেজ আপনাদের সাথে শেয়ার করবেন।",
    },
    {
        keywords: ["location", "address", "where", "কোথায়", "ঠিকানা", "জায়গা", "আবাসিক", "থাকার"],
        response: "কোর্সটি অনুষ্ঠিত হবে আমাদের আবাসিক ক্যাম্পাসে। ঠিকানা: আলি নগর গেটের বিপরীত পাশের বিল্ডিং, সাতারকুল রোড, উত্তর বাড্ডা, ঢাকা।",
    },
    {
        keywords: ["contact", "phone", "email", "যোগাযোগ", "ফোন", "ইমেইল", "হেল্পলাইন"],
        response: "যেকোনো সাপোর্ট বা তথ্যের জন্য আমাদের সাথে যোগাযোগ করতে পারেন:\n📞 **ফোন:** 01862534626 (সকাল ৯টা–বিকাল ৫টা)\n📧 **ইমেইল:** abul.hayat@skill.assunnahfoundation.org",
    },
    {
        keywords: ["module", "topic", "skill", "মডিউল", "বিষয়", "শিখব", "শেখানো হয়", "কি আছে", "সিলেবাস"],
        response: "আমাদের ৯টি কোর মডিউলের মধ্যে রয়েছে: Sales Mastery, Career Planning, Customer Service, AI for Digital Marketers, Digital Marketing, MS Office, Landing Page & Content Marketing, Business English, এবং Dawah & Business Ethics।",
    },
    {
        keywords: ["ethics", "halal", "হালাল", "ইসলামিক", "islamic"],
        response: "আমাদের প্রশিক্ষণ শতভাগ এথিক্স এবং ইসলামিক মূল্যবোধের ওপর ভিত্তি করে তৈরি। আমরা প্রফেশনাল সাকসেস এবং হালাল ইনকামের সঠিক গাইডলাইন প্রদান করি।",
    }
];

function getFallbackResponse(query: string): string {
    const lower = query.toLowerCase();
    for (const item of FALLBACK_RESPONSES) {
        if (item.keywords.some((kw) => lower.includes(kw))) {
            return item.response;
        }
    }
    return "বিস্তারিত তথ্যের জন্য অনুগ্রহ করে আমাদের হেল্পলাইনে যোগাযোগ করুন।\n📞 **ফোন:** 01862534626 (সকাল ৯টা–বিকাল ৫টা)\n📧 **ইমেইল:** abul.hayat@skill.assunnahfoundation.org";
}

export async function generateAIResponse(query: string): Promise<string> {
    // Artificial delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 500));
    return getFallbackResponse(query);
}
