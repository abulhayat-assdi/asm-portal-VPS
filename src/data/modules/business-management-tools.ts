import { CourseData } from './sales-mastery';

export const businessManagementToolsData: CourseData = {
  title: "Business Management Tools (MS Office)",
  description: "Digital Business Tools Mastery. Day-wise course outline covering MS Word, MS Excel, and MS PowerPoint for professional environments.",
  modules: [
    {
      moduleNumber: 1,
      moduleTitle: "Professional Microsoft Word Mastery",
      classes: [
        {
          className: "MS Word Fundamentals & Professional Writing",
          discussionArea: [
            "MS Word Interface, Shortcut Keys",
            "Page Setup: A4, margins, line spacing",
            "Formal Letter Structure (Date, Salutation, Body, Sign-off)",
            "Bangla & English professional writing basics",
            "Font pairing: headings & body text"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Creating Quotations & Letterheads",
          discussionArea: [
            "What is a Quotation and when to use it",
            "Insert Table, adjust columns, merge cells",
            "Quotation components: Product, Qty, Unit Price, Total, Delivery",
            "Payment Method section (Advance, Bank Transfer)",
            "Letterhead with company name, address, logo placeholder",
            "BDT currency format & Terms and Conditions"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Designing Comprehensive Sales Proposals",
          discussionArea: [
            "Sales Proposal vs Quotation — key differences",
            "5-Part Proposal: Problem → Solution → Offer → Price → Why Us",
            "Multi-page layout: Cover page, Section breaks, Page numbers",
            "Pricing table: service breakdown, monthly/one-time fee",
            "Professional footer: page number, company name, contact"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Invoice Generation & Document Templates",
          discussionArea: [
            "Invoice vs Receipt — definitions & differences",
            "Invoice: Invoice No., Due Date, Bill To, Itemized List, VAT, Total",
            "Payment Terms: due date, bKash / bank transfer / cash",
            "Receipt: Received From, Amount in Bangla words, Signature",
            "Save as .dotx template for reuse",
            "Print settings: A4, margin, print preview"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "AI-Assisted Document Creation & Formatting",
          discussionArea: [
            "ChatGPT vs Claude — which tool for what task",
            "Writing effective prompts for document generation",
            "AI-generated content: fact-check, personal touch, Bangla adaptation",
            "Fixing formatting after paste (fonts, bullets, symbols)",
            "Full workflow: Prompt → Generate → Paste → Format → Brand"
          ],
          learningObjective: "",
          days: ""
        }
      ]
    },
    {
      moduleNumber: 2,
      moduleTitle: "Professional Microsoft Excel for Business",
      classes: [
        {
          className: "Excel Interface Basics & Core Formulas",
          discussionArea: [
            "Excel Interface: Ribbon, Name Box, Formula Bar, Sheet Tab",
            "Rows, Columns & Cell References (A1, B5...)",
            "Data entry: text, number, date — correct formats",
            "Formulas: =SUM(), =AVERAGE(), =MAX(), =MIN()",
            "Cell formatting: bold, border, BDT currency, percentage",
            "AutoFill, Sheet Save, Rename & Print Setup"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Profit Margins, Formatting & Scenario Testing",
          discussionArea: [
            "Profit = Selling Price – Cost Price",
            "Profit Margin formula: =(Profit/Cost)*100",
            "Multi-product table: Cost, Price, Profit, Margin",
            "Conditional Formatting: green = profit, red = loss",
            "What-if Analysis: scenario testing with linked cells",
            "Summary row: Total Profit & Average Margin"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Building a Mini CRM & Customer Tracking",
          discussionArea: [
            "Mini CRM concept — customer tracking in Excel",
            "Columns: Name, Phone, Product, Amount, Status, Follow-Up Date",
            "Data Validation: dropdown list for Status column",
            "Filter & Sort: pending customers, follow-up date order",
            "Conditional Formatting: overdue follow-up in red",
            "=COUNTIF() for status summary; Freeze Panes"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Marketing Budget, ROI & Cost Analysis",
          discussionArea: [
            "Marketing Budget Sheet: Channel, Ad Cost, Leads, Conversions, Revenue",
            "ROI formula: =((Revenue – Ad Cost) / Ad Cost) * 100",
            "Cost Per Lead (CPL): =Ad Cost / Leads"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Conversion Tracking & Inventory Management",
          discussionArea: [
            "Conversion Rate: =(Conversions / Leads) * 100",
            "Bar/Column Chart: channel-wise cost & revenue",
            "Budget vs Actual comparison",
            "Inventory columns: Product, Opening Stock, Stock In/Out, Remaining",
            "Remaining Stock formula: =Opening + In – Out",
            "Reorder Alert: =IF(Remaining <= Reorder Level, \"Restock\", \"OK\")",
            "Conditional Formatting: low stock = red, adequate = green",
            "Stock Value: Remaining × Unit Cost",
            "Category summary using =SUMIF()"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "AI for Excel Structure & Formula Generation",
          discussionArea: [
            "How AI helps generate Excel formulas & structure",
            "Effective prompts for spreadsheet design",
            "Understanding AI-generated formulas before using",
            "AI → structure → Excel implementation workflow",
            "Identifying limitations: wrong formulas, missing context"
          ],
          learningObjective: "",
          days: ""
        }
      ]
    },
    {
      moduleNumber: 3,
      moduleTitle: "Professional Microsoft PowerPoint",
      classes: [
        {
          className: "PowerPoint Interface & Presentation Structuring",
          discussionArea: [
            "PowerPoint Interface: Ribbon, Slide Panel, Notes, View Options",
            "Presentation structure: Title → Agenda → Content → Summary → CTA",
            "Slide Discipline: 1 idea/slide, max 5-6 lines, min 24pt font",
            "Slide Master: consistent font, color & layout across deck",
            "Color theme selection for business presentations",
            "Text vs Visual balance: when to use image/icon vs bullet"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Product Pitch Design & Visual Representation",
          discussionArea: [
            "5-Part Product Presentation: Problem → Product → Benefits → Price → Offer",
            "Problem slide: using statistics & real scenarios",
            "Benefits slide: feature vs benefit distinction",
            "Pricing slide: clean table or tiered pricing layout",
            "SmartArt & Icons: product flow and comparison visuals",
            "Closing slide: strong Call to Action"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Startup Pitch Decks & Business Modeling",
          discussionArea: [
            "Pitch Deck vs Product Presentation — differences",
            "Pitch Deck structure: Cover → Problem → Solution → Market → Model → Team → Ask",
            "Street Food Startup example deck built live",
            "Market Size: TAM-SAM-SOM visual",
            "Business Model slide: revenue stream, pricing, cost",
            "The 'Ask' slide: investment amount & usage"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "The Power of Storytelling & Visual Drama",
          discussionArea: [
            "Storytelling as the most powerful presentation technique",
            "Before/After Framework: Before (problem/pain) → After (solution/gain)",
            "Topic: 'Why Your Business Needs Social Media Marketing'",
            "Emotional hook on opening slide",
            "Visual storytelling: contrast color, white space, drama",
            "Turning Point slide: the moment everything changes"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "Public Speaking, Delivery & Handling Q&A",
          discussionArea: [
            "Public speaking techniques: breathing, eye contact, posture, voice",
            "3-Minute Pitch structure: Hook → Problem+Solution → Offer → CTA",
            "Slide reading vs slide presenting — key difference",
            "Q&A handling: responding to tough questions calmly",
            "Peer feedback session",
            "Final polish checklist before live presentation"
          ],
          learningObjective: "",
          days: ""
        },
        {
          className: "AI-Accelerated Pitch & Presentation Design",
          discussionArea: [
            "AI workflow: Prompt → Slide Outline → PowerPoint → Design",
            "Effective prompts: specific topic, audience, sections",
            "Identifying AI weaknesses: generic language, missing local context",
            "AI output → PowerPoint formatting workflow",
            "AI + Human creativity: complete deck in 30-45 minutes",
            "Final review checklist: consistency, accuracy, branding"
          ],
          learningObjective: "",
          days: ""
        }
      ]
    }
  ]
};
