export interface ModuleClass {
  className: string;
  discussionArea: string[];
  learningObjective: string;
  days: string;
}

export interface SubModule {
  moduleNumber: number;
  moduleTitle: string;
  classes: ModuleClass[];
}

export interface CourseData {
  title: string;
  description: string;
  modules: SubModule[];
}

export const salesMasteryData: CourseData = {
  title: "Sales Mastery",
  description: "A comprehensive journey designed to build your skills from the ground up, combining theory with real-world practice.",
  modules: [
    {
      moduleNumber: 1,
      moduleTitle: "Sales",
      classes: [
        {
          className: "Introduction/ Preparation for Sales",
          discussionArea: ["Introduction to Sales", "Preparation for sales", "Personal Grooming"],
          learningObjective: "Know about sales and Salesman life. Getting prepared to be a salesman.",
          days: "1"
        },
        {
          className: "Essential Sales skills",
          discussionArea: ["Basic Sales skills", "Major Mistakes in Sales"],
          learningObjective: "Skills, Do's and Dont's in Sales.",
          days: "1"
        },
        {
          className: "Essential sales tools",
          discussionArea: ["Negotiation"],
          learningObjective: "Closing deals",
          days: "1"
        },
        {
          className: "Products",
          discussionArea: ["Product details", "Pricing", "USP"],
          learningObjective: "What to deal and how to deal with particular items.",
          days: "2"
        },
        {
          className: "Understand customer",
          discussionArea: ["Customer behavior", "Relation development with customer", "Strategy to win a customer"],
          learningObjective: "Understand the buyer for selling regularly.",
          days: "2"
        },
        {
          className: "Market",
          discussionArea: ["Benchmark", "Placement"],
          learningObjective: "How to define where to sale !",
          days: "1"
        },
        {
          className: "Sales Process",
          discussionArea: [
            "Generate lead/ Route",
            "Qualify prospect",
            "Different stage of sales funnel",
            "Proposal and presentation",
            "Closing call",
            "Up selling and cross selling",
            "Sales Confirmation"
          ],
          learningObjective: "Start a sales call\n\nClose a sales call",
          days: "3"
        },
        {
          className: "Practical",
          discussionArea: ["Demonstration"],
          learningObjective: "Sales practice in classroom",
          days: "2"
        },
        {
          className: "Field work",
          discussionArea: ["Practical Field training"],
          learningObjective: "Field training DSR -7 days, SR- 7 days.",
          days: "-"
        },
        {
          className: "Assessment",
          discussionArea: ["Written and viva"],
          learningObjective: "Marking on overall performance",
          days: "-"
        }
      ]
    },
    {
      moduleNumber: 2,
      moduleTitle: "Soft Skills",
      classes: [
        {
          className: "Introduction to Communication\nEffective Communication",
          discussionArea: [
            "Importance of communication in sales",
            "Verbal vs. non-verbal communication",
            "Barriers to effective communication"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Active Listening",
          discussionArea: [
            "Techniques for active listening",
            "Importance of feedback and clarification",
            "The role of empathy in communication"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Tailoring Your Message\nPersuasive Communication\nHandling Objections & Rejections\nBuilding Rapport and Trust",
          discussionArea: [
            "Understanding different customer personas",
            "Adapting communication styles to fit different audiences",
            "Importance of clarity and conciseness",
            "Principles of persuasion",
            "Structuring a persuasive sales pitch",
            "The role of storytelling in sales",
            "Common objections in sales and strategies to overcome them",
            "Importance of maintaining composure and professionalism",
            "Techniques for re-framing objections as opportunities",
            "The significance of rapport in sales",
            "Techniques for building trust with clients",
            "Long-term relationship management"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Soft Skill Sharpening",
          discussionArea: [
            "Leadership, Time management, Problem Solving & decision making, Teamwork, Adaptability, Emotional Intelligence, Conflict Resolution."
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Assessment",
          discussionArea: ["Overall Assessment ( Writing or group viva)"],
          learningObjective: "",
          days: "1"
        }
      ]
    },
    {
      moduleNumber: 3,
      moduleTitle: "Marketing Basic",
      classes: [
        {
          className: "Marketing Concepts\nUnderstanding the Target Market\nDeveloping a Value Proposition",
          discussionArea: [
            "Definition and purpose of marketing",
            "Relation between Sales and Marketing",
            "The role of marketing in business",
            "The Marketing Mix (4 Ps)",
            "Traditional vs. digital marketing",
            "Market Research Fundamentals",
            "Customer Segmentation",
            "Understanding its importance in marketing",
            "Identifying unique selling points (USPs)",
            "Communicating value to customers effectively"
          ],
          learningObjective: "",
          days: "1"
        }
      ]
    },
    {
      moduleNumber: 4,
      moduleTitle: "Distribution",
      classes: [
        {
          className: "Introduction to Distribution",
          discussionArea: [
            "Definition and importance of distribution in marketing",
            "The role of distribution in the supply chain",
            "Types of Distribution Channels"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Distribution Strategies",
          discussionArea: [
            "Intensive, selective, and exclusive distribution",
            "Factors influencing distribution strategy choice",
            "Designing a distribution channel: key considerations and steps"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Logistics and Supply Chain Management",
          discussionArea: [
            "Definition and components of logistics",
            "Importance of logistics in distribution",
            "Overview of the supply chain",
            "Role of suppliers, manufacturers, and retailers"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Retail Distribution\nWholesale Distribution",
          discussionArea: [
            "Understanding Retail Distribution",
            "Retail Management",
            "Role of Wholesalers",
            "Choosing Wholesale Partners"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Assessment",
          discussionArea: ["Overall Assessment ( Written and group Viva)"],
          learningObjective: "",
          days: "4"
        }
      ]
    },
    {
      moduleNumber: 5,
      moduleTitle: "Workplace Etiquette",
      classes: [
        {
          className: "Prepare for a new workplace",
          discussionArea: [
            "New Office Environment",
            "Do's and Don'ts",
            "Mission and vision realization"
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Adaptability",
          discussionArea: [
            "Adaptability basic",
            "Adaptability in office environment"
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Office Politics",
          discussionArea: [
            "Office politics demo",
            "How to handle Office politics"
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Boss Management",
          discussionArea: [
            "Boss is always BAD!",
            "How to be good with Boss",
            "Be a good Boss"
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Ethics and culture",
          discussionArea: ["Work culture", "Ethics"],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "The Team",
          discussionArea: [
            "What is TEAM",
            "Why is TEAM",
            "Why TEAM is important",
            "How to be a TEAM Player",
            "How to manage a TEAM"
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Interpersonal relationship",
          discussionArea: [
            "Knowing colleagues",
            "Know how on Professional relationship"
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Job switch",
          discussionArea: [
            "Basic mistakes during changing jobs",
            "Do's and Don'ts",
            "Change the job not the .........."
          ],
          learningObjective: "",
          days: "0.25"
        },
        {
          className: "Assessment",
          discussionArea: ["Overall Assessment ( Written and group Viva)"],
          learningObjective: "",
          days: "-"
        }
      ]
    }
  ]
};
