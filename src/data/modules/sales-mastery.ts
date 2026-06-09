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
      moduleTitle: "Sales Mastery",
      classes: [
        {
          className: "Introduction to Sales\nPreparation for Sales\nPersonal Grooming",
          discussionArea: [
            "Introduction to Sales",
            "Preparation for Sales",
            "Personal Grooming"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Essential Sales Skills\nMajor Mistakes in Sales",
          discussionArea: [
            "Essential Sales skills",
            "Major mistakes in sales"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "What is Business\nSales vs Business\nHalal Business",
          discussionArea: [
            "What is Business",
            "Sales vs Business",
            "Halal Business"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Marketing Concepts",
          discussionArea: [
            "Marketing Concepts"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Communication",
          discussionArea: [
            "Communication"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Negotiation",
          discussionArea: [
            "Negotiation"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Sales Mastering",
          discussionArea: [
            "Sales Mastering"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Sales Mastering",
          discussionArea: [
            "Sales Mastering"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Sales Mastering\n(Reserve day)",
          discussionArea: [
            "Sales Mastering (Reserve day)"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Sales Mathematics",
          discussionArea: [
            "Sales Mathematics"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Sales Mathematics",
          discussionArea: [
            "Sales Mathematics"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Costing and Pricing",
          discussionArea: [
            "Costing and Pricing"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Distribution & Supply Chain Understanding",
          discussionArea: [
            "Distribution & Supply chain understanding"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Office Etiquette",
          discussionArea: [
            "Office etiquette"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Soft Skills and Self Development",
          discussionArea: [
            "Soft skills and Self development"
          ],
          learningObjective: "",
          days: "1"
        },
        {
          className: "Solving Issues from Market Responses",
          discussionArea: [
            "Solving issues from market responses"
          ],
          learningObjective: "",
          days: "1"
        }
      ]
    }
  ]
};
