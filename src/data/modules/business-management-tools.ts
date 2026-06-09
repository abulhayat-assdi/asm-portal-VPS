import { CourseData } from './sales-mastery';

export const businessManagementToolsData: CourseData = {
  title: "Business Management Tools",
  description: "MS Word, MS Excel ও MS PowerPoint — এই তিনটি টুল দিয়ে professional business document, data analysis ও persuasive presentation তৈরির সম্পূর্ণ হাতে-কলমে কোর্স।",
  modules: [
    {
      moduleNumber: 1,
      moduleTitle: "MS Word — Professional Document Writing",
      classes: [
        {
          className: "Professional Writing Basics",
          discussionArea: [
            "MS Word Interface পরিচিতি — Ribbon, Quick Access Toolbar, View Options এবং Shortcut keys (Ctrl+S, Ctrl+Z, Ctrl+B)",
            "Page Setup: A4 margin, line spacing, paragraph spacing — প্রতিটি professional document-এ যা থাকে তার সঠিক সেটিং",
            "Bangla ও English উভয় ভাষায় formal business writing-এর পার্থক্য — কখন কোন ভাষা ব্যবহার করতে হয়",
            "Formal Letter-এর structure: Date → Reference → Salutation → Body → Sign-off",
            "Client-friendly professional tone: কঠিন ভাষা না লিখে সহজ, সম্মানজনক ও স্পষ্ট ভাষায় communicate করার কৌশল",
            "Font pairing: Heading-এ Arial Bold, body-তে Times New Roman — কোনটা কোথায় মানায়"
          ],
          learningObjective: "Assignment: একটি কাল্পনিক কোম্পানির পরিচয় দিয়ে একটি Formal Introduction Letter তৈরি করতে হবে — Bangla version ও English version আলাদাভাবে, দুটোই A4-এ print-ready ফরম্যাটে।",
          days: "1"
        },
        {
          className: "Business Quotation তৈরি করা",
          discussionArea: [
            "Quotation কী এবং কেন দরকার — ব্যবসায়িক লেনদেনে Quotation-এর ভূমিকা",
            "MS Word Table: Insert Table → Column width adjust → Cell merge → Header row format",
            "Quotation-এর ৬টি মূল উপাদান: Product Name, Description, Quantity, Unit Price, Total Amount, Delivery Timeline",
            "Payment Method section যোগ করা: Advance, Credit, Bank Transfer — কোন ব্যবসায় কোন পদ্ধতি উপযুক্ত",
            "Letterhead তৈরি: Header-এ company name, address ও contact info সাজানো — logo placeholder insert করা",
            "BDT currency format সঠিকভাবে লেখা এবং Terms & Conditions section যোগ করা"
          ],
          learningObjective: "Assignment: একটি Garments Supplier-এর হয়ে ১০০ পিস টি-শার্ট সরবরাহের জন্য পূর্ণাঙ্গ Quotation তৈরি করতে হবে। Product item, size breakdown, unit price, total (with VAT), delivery date এবং payment terms অবশ্যই থাকতে হবে।",
          days: "1"
        },
        {
          className: "Basic Sales Proposal লেখা",
          discussionArea: [
            "Sales Proposal এবং Quotation-এর পার্থক্য — কখন Proposal পাঠাতে হয়",
            "Proposal-এর ৫-part structure: (১) Problem, (২) Solution, (৩) Offer, (৪) Price, (৫) Why Us",
            "Word-এ multi-page document layout: Cover page, section break, automatic page numbering",
            "Pricing table তৈরি: service breakdown, monthly/one-time fee, total — যেকোনো ব্যবসার জন্য adapt করার কৌশল",
            "Compelling 'Why Us' section লেখার কৌশল — অভিজ্ঞতা, unique value, client testimonial placeholder দিয়ে বিশ্বাসযোগ্য করে তোলা",
            "Professional footer: page number, company name ও contact info — multi-page document-এ consistent footer বজায় রাখা"
          ],
          learningObjective: "Assignment: একটি Digital Marketing Agency থেকে একটি local restaurant-কে target করে পূর্ণাঙ্গ Sales Proposal তৈরি করতে হবে। Cover page, Problem section, Solution ও Offer, Pricing table এবং Why Us section সহ minimum ৩ পেজ হতে হবে।",
          days: "1"
        },
        {
          className: "Invoice ও Payment Receipt তৈরি",
          discussionArea: [
            "Invoice এবং Receipt-এর মধ্যে পার্থক্য: Invoice মানে 'টাকা দেওয়ার অনুরোধ', Receipt মানে 'টাকা পাওয়ার নিশ্চিতকরণ'",
            "Invoice-এর সম্পূর্ণ কাঠামো: Invoice Number, Issue Date, Due Date, Client Info, Itemized list, Subtotal, VAT, Grand Total",
            "Payment Terms section লেখা: Due date, accepted payment methods (bKash, bank transfer, cash), late payment policy",
            "Payment Receipt: আলাদা layout, Received From, Amount in words, Payment date ও method, Authorized signature line",
            "Word-এ document template (.dotx) হিসেবে সেভ করার কৌশল — পরবর্তীতে শুধু তথ্য বদলে document ready করার workflow",
            "Print settings: A4 single-page layout, margin adjustment, print preview — কোনো কাটাছেঁড়া ছাড়া professional print নিশ্চিত করা"
          ],
          learningObjective: "Assignment: Restaurant client-এর project-এর জন্য একটি Invoice এবং একটি Advance Payment Receipt তৈরি করতে হবে। Invoice-এ Itemized service list (minimum ৩টি), 15% VAT, Grand Total এবং Receipt-এ amount in Bangla words ও signature block থাকতে হবে।",
          days: "1"
        },
        {
          className: "AI দিয়ে Word Content তৈরি",
          discussionArea: [
            "AI কী এবং ব্যবসায়িক ডকুমেন্ট তৈরিতে এটি কীভাবে সাহায্য করে — ChatGPT ও Claude-এর পার্থক্য",
            "Effective prompt লেখার কৌশল: শুধু 'write a proposal' না লিখে — client, problem, service, tone সব নির্দিষ্ট করে দিলে কতটা ভালো output পাওয়া যায়",
            "AI-generated content-এর দুর্বলতা চেনা — কোথায় fact check দরকার, কোথায় personal touch দিতে হবে",
            "Word-এ paste করার পর formatting fix: AI content-এ থাকা unwanted symbols, inconsistent font, broken bullets ঠিক করার কৌশল",
            "AI + Word combined workflow: prompt → generate → paste → format → brand → final document এই পুরো pipeline আয়ত্ত করা"
          ],
          learningObjective: "Assignment: যেকোনো একটি client বেছে নিয়ে AI ব্যবহার করে Sales Proposal draft তৈরি করতে হবে। AI prompt-এর screenshot ও generated content সহ Word-এ formatted final document — দুটোই জমা দিতে হবে।",
          days: "1"
        }
      ]
    },
    {
      moduleNumber: 2,
      moduleTitle: "MS Excel — Data & Business Analytics",
      classes: [
        {
          className: "Excel Basics — স্প্রেডশিটের ভিত্তি",
          discussionArea: [
            "Excel Interface পরিচিতি: Ribbon, Name Box, Formula Bar, Sheet Tab — কোথায় কী আছে",
            "Row ও Column-এর পার্থক্য — Row নম্বর ও Column letter দিয়ে cell address (যেমন A1, B5) তৈরি হয়",
            "Data entry: text, number এবং date আলাদাভাবে cell-এ সঠিক format-এ রাখার কৌশল",
            "Basic Formulas: =SUM(), =AVERAGE(), =MAX(), =MIN() — এই চারটি formula দিয়ে মূল গাণিতিক কাজ করা",
            "Cell formatting: font size, bold, border, background color, number format (BDT currency, percentage)",
            "AutoFill, Sheet Save, Rename এবং A4 layout-এ Print setup সঠিকভাবে করা"
          ],
          learningObjective: "Assignment: একটি ৭ দিনের Daily Sales Sheet তৈরি করতে হবে। Sheet-এ থাকবে: Date, Product Name, Quantity Sold, Unit Price এবং Daily Total (formula দিয়ে)। সপ্তাহের মোট বিক্রয়, সর্বোচ্চ বিক্রয়ের দিন (MAX) এবং গড় দৈনিক বিক্রয় (AVERAGE) বের করতে হবে।",
          days: "1"
        },
        {
          className: "Profit Calculation — লাভ-ক্ষতির হিসাব",
          discussionArea: [
            "Profit Calculation-এর মূল তিনটি ধাপ: Cost Price → Selling Price → Profit বোঝা এবং formula",
            "Profit formula: =Selling Price - Cost Price এবং Profit Margin: =(Profit/Cost Price)*100",
            "Multiple products-এর জন্য একটি table তৈরি করা — প্রতিটি row-তে আলাদা পণ্যের data",
            "Conditional Formatting: Profit positive হলে সবুজ, negative হলে লাল — data দেখেই বোঝা যাবে",
            "What-if Analysis: Selling Price বাড়ালে বা কমালে profit কীভাবে বদলায় — scenario test করা",
            "Total Profit ও Average Margin বের করা — পুরো product list-এর সামগ্রিক performance দেখার জন্য summary row"
          ],
          learningObjective: "Assignment: কমপক্ষে ৮টি পণ্য নিয়ে একটি Profit Calculation Sheet তৈরি করতে হবে। Conditional Formatting (profit = সবুজ, loss = লাল) এবং Summary Row-তে Total Profit ও Average Margin % থাকতে হবে।",
          days: "1"
        },
        {
          className: "Sales Tracker — Mini CRM (Part 1)",
          discussionArea: [
            "CRM (Customer Relationship Management) কী এবং Excel দিয়ে ছোট ব্যবসার জন্য mini-CRM বানানো",
            "Sales Tracker-এর মূল columns: Customer Name, Phone, Product, Order Amount, Status, Follow-Up Date",
            "Data Validation: Status column-এ dropdown list (Pending/Confirmed/Delivered/Cancelled) তৈরি করা",
            "Filter ও Sort: নির্দিষ্ট status বের করা, follow-up date অনুযায়ী sort করা"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Sales Tracker — Mini CRM (Part 2)",
          discussionArea: [
            "Conditional Formatting দিয়ে overdue follow-up highlight করা",
            "=COUNTIF() দিয়ে status count — কতজন Pending, কতজন Delivered সহজেই বের করা",
            "Freeze Panes: বড় data scroll করার সময় header row সবসময় দেখা থাকবে",
            "পুরো Sales Tracker sheet finalize এবং professional formatting"
          ],
          learningObjective: "Assignment: কমপক্ষে ১৫ জন customer-এর data দিয়ে একটি পূর্ণাঙ্গ Sales Tracker sheet তৈরি করতে হবে। Status dropdown, overdue Conditional Formatting এবং COUNTIF দিয়ে Summary section থাকতে হবে।",
          days: "1"
        },
        {
          className: "Marketing Budget Sheet",
          discussionArea: [
            "Marketing Budget Sheet-এর প্রয়োজনীয়তা — কোন channel-এ কত খরচ হলো ও কতটুকু return এলো তা track করা",
            "মূল columns: Channel, Ad Cost (BDT), Total Leads, Conversions, Revenue তৈরি করা",
            "ROI formula: =((Revenue - Ad Cost) / Ad Cost) * 100 — কোন channel সবচেয়ে বেশি লাভজনক বোঝা",
            "Cost Per Lead (CPL): =Ad Cost / Leads এবং Conversion Rate: =(Conversions / Leads) * 100",
            "Bar Chart / Column Chart তৈরি: channel-wise ad cost ও revenue-কে visual chart-এ দেখানো",
            "Budget vs Actual comparison: planned budget-এর পাশে actual spend রেখে variance track করা"
          ],
          learningObjective: "Assignment: কমপক্ষে ৪টি marketing channel নিয়ে Marketing Budget Sheet তৈরি করতে হবে। Ad Cost, Leads, Conversions, Revenue, ROI (%), CPL এবং Conversion Rate (%) সব formula দিয়ে, এবং Channel-wise ROI comparison Bar Chart যোগ করতে হবে।",
          days: "1"
        },
        {
          className: "Inventory Management Sheet",
          discussionArea: [
            "Inventory Management কেন দরকার — stock শেষ হওয়ার আগে না জানলে ব্যবসায় ক্ষতি হয়; Excel দিয়ে সমাধান",
            "মূল columns: Product Name, Category, Opening Stock, Stock In, Stock Out, Closing Stock তৈরি করা",
            "Remaining Stock formula: =Opening Stock + Stock In - Stock Out — real-time stock সবসময় updated থাকবে",
            "Reorder Alert: =IF(Remaining <= Reorder Level, \"⚠ Restock Needed\", \"OK\") — automatic alert তৈরি",
            "Conditional Formatting: low stock = লাল, adequate stock = সবুজ — inventory health এক নজরে",
            "Stock Value: Remaining Stock × Unit Cost এবং SUMIF() দিয়ে Category-wise Summary তৈরি"
          ],
          learningObjective: "Assignment: কমপক্ষে ১০টি পণ্য নিয়ে Inventory Sheet তৈরি করতে হবে। Remaining Stock ও Reorder Alert (IF formula), Conditional Formatting এবং Category-wise SUMIF summary সহ print-ready formatting-এ জমা দিতে হবে।",
          days: "1"
        },
        {
          className: "AI দিয়ে Excel Formulas ও Structure",
          discussionArea: [
            "AI কীভাবে Excel formula শেখায় সাহায্য করতে পারে — জটিল formula মুখস্থ না করে AI-কে describe করলেই হয়",
            "Effective prompt লেখার কৌশল: 'Create a sales tracking spreadsheet structure...' — এই ধরনের specific prompt থেকে complete structure পাওয়া যায়",
            "AI-generated formula বোঝার পদ্ধতি — শুধু copy-paste না করে formula কী করছে তা বুঝে ব্যবহার করার অভ্যাস",
            "AI দিয়ে spreadsheet structure তৈরি: column headers, data validation rules, formula logic — Excel-এ implement করার workflow",
            "AI-generated content-এর সীমাবদ্ধতা চেনা — ভুল formula, বাংলাদেশের context-এ অপ্রাসঙ্গিক suggestion চিহ্নিত করা",
            "AI + Excel combined workflow: prompt → generate → implement → test → refine"
          ],
          learningObjective: "Assignment: AI ব্যবহার করে একটি Small Business-এর Sales Tracking Spreadsheet তৈরি করতে হবে। AI prompt-এর screenshot জমা দিতে হবে এবং Excel-এ minimum ৫টি formula সহ পূর্ণাঙ্গ sheet implement করতে হবে।",
          days: "1"
        }
      ]
    },
    {
      moduleNumber: 3,
      moduleTitle: "MS PowerPoint — Business Presentation",
      classes: [
        {
          className: "Presentation Basics",
          discussionArea: [
            "PowerPoint Interface পরিচিতি: Ribbon, Slide Panel, Notes Section, View Options — কোথায় কী আছে",
            "Presentation Structure-এর golden rule: Title Slide → Agenda → Content Slides → Summary → Call to Action",
            "Slide Discipline: একটি slide-এ একটি মূল বার্তা, maximum ৫-৬ লাইন text, সঠিক font size",
            "Color Theme নির্বাচন: business presentation-এর জন্য কোন color combination professional দেখায়",
            "Text vs Visual balance: কখন bullet point, কখন শুধু image বা icon দিয়ে পুরো বার্তা দেওয়া যায়"
          ],
          learningObjective: "Assignment: একটি ৬-slide 'Self Introduction' presentation তৈরি করতে হবে। Slide Master দিয়ে consistent design এবং প্রতিটি slide-এ maximum ৫ লাইন text ও অন্তত একটি visual element থাকতে হবে।",
          days: "1"
        },
        {
          className: "Product Presentation",
          discussionArea: [
            "Product Presentation-এর ৫-part framework: (১) Problem, (২) Product, (৩) Benefits, (৪) Price, (৫) Offer",
            "Problem slide তৈরি: পরিসংখ্যান বা real-life scenario দিয়ে audience-কে সমস্যাটি অনুভব করানোর কৌশল",
            "Benefits slide design: feature নয়, benefit বলতে হবে — 'এটা থাকলে আপনি এই সুবিধা পাবেন' বলার কৌশল",
            "Pricing slide: clean table বা tiered pricing layout দিয়ে মূল্য উপস্থাপন",
            "SmartArt ও Icons ব্যবহার: product flow বা comparison দেখাতে visual element কার্যকর",
            "Closing slide-এ strong Call to Action: 'Contact us', 'Order now', 'Book a demo'"
          ],
          learningObjective: "Assignment: যেকোনো একটি পণ্য নিয়ে ৮-১০ slide-এর Product Presentation তৈরি করতে হবে। পাঁচটি section (Problem, Product, Benefits, Price, Offer) এবং প্রতিটি slide-এ visual element অবশ্যই থাকতে হবে।",
          days: "1"
        },
        {
          className: "Sales Pitch Deck",
          discussionArea: [
            "Pitch Deck কী এবং Product Presentation-এর সাথে পার্থক্য — Pitch Deck-এ business-এর পুরো picture তোলা হয়",
            "Pitch Deck-এর standard structure: Cover → Problem → Solution → Market Size → Business Model → Traction → Team → Financials → Ask",
            "Street Food Startup-এর উদাহরণ দিয়ে পুরো pitch deck বানানো — investor-friendly ভাষায় উপস্থাপন",
            "Market Size slide: TAM-SAM-SOM concept এবং সহজ visual দিয়ে market opportunity দেখানো",
            "Business Model slide: revenue stream, pricing model এবং cost structure সহজ ও visually উপস্থাপন",
            "The 'Ask' slide: কী চাওয়া হচ্ছে এবং সেই অর্থ কীভাবে ব্যবহার হবে — বিশ্বাসযোগ্যভাবে বলার কৌশল"
          ],
          learningObjective: "Assignment: একটি Business-এর জন্য ১০-১২ slide-এর পূর্ণাঙ্গ Sales Pitch Deck তৈরি করতে হবে। Business model, target market, pricing ও investment ask সব section এবং অন্তত একটি chart বা data visualization থাকতে হবে।",
          days: "1"
        },
        {
          className: "Storytelling Slides",
          discussionArea: [
            "Storytelling কেন সবচেয়ে শক্তিশালী presentation technique — facts মানুষ ভুলে যায়, কিন্তু গল্প মনে থাকে",
            "Before/After framework: Before — সমস্যার চিত্র (কষ্ট, হতাশা), After — সমাধানের পরের অবস্থা (স্বস্তি, সাফল্য)",
            "উদাহরণ: 'Why Your Business Needs Social Media Marketing' — Before/After কাঠামোতে সাজানো",
            "Emotional hook তৈরি: প্রথম slide-এ এমন সমস্যার চিত্র যেন audience বলে 'এটা তো আমার কথাই বলছে'",
            "Visual storytelling: image, contrast color এবং white space ব্যবহার করে slide-এ drama তৈরির কৌশল",
            "Transition between Before and After: একটি powerful 'turning point' slide তৈরি করা"
          ],
          learningObjective: "Assignment: 'Why Your Business Needs Social Media Marketing' বিষয়ে ৮-১০ slide Storytelling Presentation তৈরি করতে হবে। Before section (৩-৪ slide) ও After section (৩-৪ slide) এবং strong opening hook ও memorable closing থাকতে হবে।",
          days: "1"
        },
        {
          className: "Live Presentation",
          discussionArea: [
            "Public speaking-এর ভয় কাটানোর technique: breathing, eye contact, posture এবং voice modulation অনুশীলন",
            "৩ মিনিটের pitch structure: ৩০ sec hook → ১ min problem+solution → ১ min offer+benefit → ৩০ sec call to action",
            "Slide-এর সাথে কথার সম্পর্ক: slide পড়া নয়, slide দেখিয়ে কথা বলা — এই পার্থক্য একজন presenter-কে আলাদা করে",
            "Q&A handling: presentation শেষে প্রশ্নের জন্য prepare করা — হঠাৎ কঠিন প্রশ্নেও শান্তভাবে উত্তর দেওয়া",
            "Peer feedback session: একে অপরের presentation দেখে constructive feedback দেওয়া এবং নেওয়া",
            "Final polish checklist: typo, design inconsistency এবং content gap ঠিক করার habit তৈরি করা"
          ],
          learningObjective: "Assignment: আগের class-এ তৈরি করা presentation ব্যবহার করে সামনে দাঁড়িয়ে ৩ মিনিটের live pitch দিতে হবে। Slide পড়া নয়, নিজের ভাষায় present করতে হবে এবং ২টি প্রশ্নের উত্তর দিতে হবে।",
          days: "1"
        },
        {
          className: "AI দিয়ে Presentation Builder",
          discussionArea: [
            "AI দিয়ে presentation content তৈরির workflow: prompt দেওয়া → slide outline generate → PowerPoint-এ সাজানো",
            "Effective prompt: 'Create a 10 slide pitch deck for a tea brand targeting urban youth in Bangladesh...' — specific prompt-এ ভালো output",
            "AI-generated content-এর দুর্বলতা: generic language, missing local context, inaccurate data চিহ্নিত করে edit করা",
            "ChatGPT output → PowerPoint workflow: generate করা text দ্রুত slides-এ সাজানো ও design যোগ করা",
            "AI + creativity combination: AI-generated outline + মানুষের creativity = মাত্র ৩০-৪৫ মিনিটে complete pitch deck",
            "Final review checklist: consistency, accuracy এবং brand alignment চেক করার habit তৈরি হবে"
          ],
          learningObjective: "Assignment: AI ব্যবহার করে একটি Tea Brand-এর জন্য ১০ slide-এর Pitch Deck তৈরি করতে হবে। AI prompt-এর screenshot এবং AI-generated content ও নিজে edited version-এর পার্থক্য note হিসেবে দেখাতে হবে।",
          days: "1"
        }
      ]
    }
  ]
};
