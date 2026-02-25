import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import InstructorCard from "@/components/ui/InstructorCard";

export default function InstructorsPage() {
    const navLinks = [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Module", href: "/modules" },
        { label: "Instructors", href: "/instructors", isActive: true },
        { label: "Success Stories", href: "/feedback" },
        { label: "Contact & Q&A", href: "/contact" },
        { label: "Blog", href: "/blog" },
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
                { label: "Success Stories", href: "/feedback" },
                { label: "Contact & Q&A", href: "/contact" },
                { label: "Enroll / Learn More", href: "/enroll" },
            ],
        },
    ];

    const instructors = [
        {
            name: "Golam Kibria",
            role: "Senior Instructor (Academic)",
            photo: "/images/instructors/golam-kibria.jpeg",
            description: "Golam Kibria holds a B.A. (Hons) and an M.A. in English from a reputed public university. Later, he earned an MBA in Marketing from IBA, DU, achieving a CGPA of 3.64 out of 4. He began his career as a teacher at a Cantt. Public School & College and later transitioned into roles such as Merchandiser and Radio Jockey. Currently, he has been serving as a Senior Assistant Vice President (SAVP) at a Private Commercial Islamic Bank for almost 18 years. Golam Kibria is an experienced trainer and instructor, having conducted sessions at the bank's training center. Most recently, he had the opportunity to train a series of participants under a World Bank Project. His lucid and engaging storytelling, combined with his ability to explain complex concepts in a simple manner, has made him increasingly sought after for training sessions.",
            email: "kibria@assunnahfoundation.org",
        },
        {
            name: "Mohammad Abu Zabar Rezvhe",
            role: "Senior Instructor (Academic)",
            photo: "/images/instructors/abu-zabar-rezvhe.jpg",
            description: "Mr. Mohammad Abu Zabar Rezvhe is a seasoned sales professional with over 18 years of experience in sales, marketing, and business development across FMCG, Telecommunications, and Retail sectors. He has successfully led high-performing sales teams, developed impactful training programs, and driven strategic market growth. As a sales trainer, Mr. Rezvhe has designed and delivered structured training programs, equipping individuals with essential sales techniques, negotiation skills, and customer engagement strategies. He has played a pivotal role in new market expansion, including spearheading the Bangladesh market entry strategy for Atlas Axillia. His leadership has resulted in record-breaking sales growth, improved team performance, and optimized business operations for companies like Grameenphone, PRAN-RFL, Godrej, and Hemas Holdings PLC. Mr. Rezvhe is committed to transforming \"The Art of Sales and Marketing\" into a leading employment-focused training program, producing industry-ready sales professionals.",
            email: "rezvhe@gmail.com",
        },
        {
            name: "Shaibal Shariar",
            role: "Senior Instructor (Academic)",
            photo: "/images/instructors/shaibal-shariar.jpg",
            description: "CEO & Co-Founder of Prokrity Store, Quantic Dynamics Ltd, Amcare Agro, and Dr. Kit Healthcare. He holds a BBA from IUB, a PGDHRM from the United Kingdom, and ACBA from IBA, DU. With a decade of experience in top management roles, he is a seasoned expert in Business Process Development. His strategic insights and innovative approach have helped organizations optimize efficiency, streamline operations, and achieve sustainable growth. Over the years, he has played a pivotal role in shaping the operational frameworks of more than 40 organizations, including the ICT Ministry Bangladesh Government, 03 international companies, 05 multinational corporations, and 11 local banks. His expertise spans multiple industries, enabling businesses to navigate complex challenges and drive long-term success. Passionate about transformation and innovation, he continues to mentor and guide enterprises toward excellence.",
            email: "shibalshariar@gmail.com",
        },
        {
            name: "Md. Nesar Uddin",
            role: "Instructor (Academic)",
            photo: "/images/instructors/nesar-uddin.jpg",
            description: "Bio will be updated soon.",
            email: "mnumaruf@gmail.com",
        },
        {
            name: "M M Naim Amran",
            role: "Instructor (Academic)",
            photo: "/images/instructors/naim-amran.jpg",
            description: "Bio will be updated soon.",
            email: "Nayeem2007@gmail.com",
        },
        {
            name: "Abul Hayat",
            role: "Administrative",
            photo: "/images/instructors/abul-hayat.jpg",
            description: "Bio will be updated soon.",
            email: "abul.hayat@skill.assunnahfoundation.org",
        },
    ];




    const approachPoints = [
        {
            title: "Field Guidance",
            description: "Guiding students during fieldwork and real customer interactions.",
        },
        {
            title: "Continuous Feedback",
            description: "Providing continuous feedback and practical correction.",
        },
        {
            title: "Ethical Accountability",
            description: "Emphasizing ethical behavior, discipline, and professional accountability.",
        },
    ];

    return (
        <>
            <Header
                brandText="Sales & Marketing"
                navLinks={navLinks}
                ctaText="Enroll"
            />

            <main className="min-h-screen bg-white">
                {/* 3. Instructors Grid Section */}
                <section className="w-full bg-white py-16 md:py-20">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1f2937] mb-4">
                                Meet Our Team
                            </h2>
                            <p className="text-[#6b7280] leading-relaxed">
                                Dedicated professionals committed to helping you grow with practical skills and ethical values.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructors.map((instructor, index) => (
                                <InstructorCard
                                    key={index}
                                    index={index}
                                    name={instructor.name}
                                    role={instructor.role}
                                    description={instructor.description}
                                    email={instructor.email}
                                    image={instructor.photo}
                                />
                            ))}
                        </div>

                    </div>
                </section>



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
