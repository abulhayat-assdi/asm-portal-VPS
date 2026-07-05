import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
} from "docx";
import type { CvDraftFull } from "../schemas";

export async function generateDocxBuffer(data: CvDraftFull): Promise<Buffer> {
    const rawCfg = data.template?.config;
    const sidebarColor = rawCfg?.sidebarColor || "#1e3a5f";
    const primaryColorHex = sidebarColor.replace("#", "");

    const fontName = "Arial";
    const sectionTitleSize = 26; // 13pt
    const normalTextSize = 21; // 10.5pt
    const subTitleSize = 22; // 11pt

    const borderlessTableBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    };

    // Helper to create a section heading with a bottom border line
    const createSectionHeader = (title: string) => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: title.toUpperCase(),
                    bold: true,
                    size: sectionTitleSize,
                    color: primaryColorHex,
                    font: fontName,
                }),
            ],
            border: {
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 12, // ~1.5pt
                    space: 4,
                    color: primaryColorHex,
                },
            },
            spacing: { before: 260, after: 120 },
        });
    };

    const children: any[] = [];

    // 1. Header (Name + Contact details)
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: data.fullName || "CV",
                    bold: true,
                    size: 38, // 19pt
                    color: primaryColorHex,
                    font: fontName,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
        })
    );

    const contactItems: string[] = [];
    if (data.phone) contactItems.push(data.phone);
    if (data.email) contactItems.push(data.email);
    if (data.address) contactItems.push(data.address);
    if (data.linkedin) contactItems.push(data.linkedin);

    if (contactItems.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: contactItems.join("  |  "),
                        size: normalTextSize,
                        font: fontName,
                        color: "555555",
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            })
        );
    }

    const visibleSections = data.visibleSections || [
        "careerObjective",
        "workExperience",
        "training",
        "education",
        "references",
        "skills",
        "languages",
        "hobbies",
        "personalInfo",
        "declaration",
    ];

    const rawOrder: string[] = Array.isArray(data.sectionOrder) && data.sectionOrder.length
        ? (data.sectionOrder as string[])
        : ["careerObjective", "workExperience", "training", "education", "references", "declaration"];

    // Add extra items to end of order if not present
    const sectionOrder = [...rawOrder];
    const defaultSections = [
        "careerObjective",
        "workExperience",
        "training",
        "education",
        "references",
        "skills",
        "languages",
        "hobbies",
        "personalInfo",
        "declaration",
    ];
    for (const key of defaultSections) {
        if (!sectionOrder.includes(key)) {
            sectionOrder.push(key);
        }
    }

    // Render visible sections in order
    sectionOrder.forEach((key) => {
        if (!visibleSections.includes(key)) return;

        if (key === "careerObjective" && data.careerObjective) {
            children.push(createSectionHeader("Career Objective"));
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: data.careerObjective,
                            size: normalTextSize,
                            font: fontName,
                        }),
                    ],
                    spacing: { after: 120 },
                })
            );
        }

        else if (key === "workExperience" && data.workExperience && data.workExperience.length > 0) {
            children.push(createSectionHeader("Work Experience"));
            data.workExperience.forEach((item: any) => {
                if (!item) return;

                const locationStr = item.location ? `, ${item.location}` : "";
                const compLoc = `${item.company}${locationStr}`;
                const dateStr = [item.startDate, item.endDate].filter(Boolean).join(" – ");

                // Row with Job Title (left) and Date (right)
                children.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borderlessTableBorders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 70, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: item.jobTitle || "",
                                                        bold: true,
                                                        size: subTitleSize,
                                                        font: fontName,
                                                    }),
                                                ],
                                                spacing: { after: 30 },
                                            }),
                                        ],
                                    }),
                                    new TableCell({
                                        width: { size: 30, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: dateStr || "",
                                                        size: normalTextSize,
                                                        font: fontName,
                                                        color: "777777",
                                                    }),
                                                ],
                                                alignment: AlignmentType.RIGHT,
                                                spacing: { after: 30 },
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                // Paragraph for Company and Location
                if (compLoc) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: compLoc,
                                    italics: true,
                                    size: normalTextSize,
                                    font: fontName,
                                    color: "555555",
                                }),
                            ],
                            spacing: { after: 60 },
                        })
                    );
                }

                // Bullets
                if (item.bullets && Array.isArray(item.bullets)) {
                    item.bullets.filter(Boolean).forEach((bullet: string) => {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: bullet,
                                        size: normalTextSize,
                                        font: fontName,
                                    }),
                                ],
                                bullet: { level: 0 },
                                spacing: { before: 20, after: 20 },
                            })
                        );
                    });
                }

                // Add empty spacer
                children.push(new Paragraph({ spacing: { after: 100 } }));
            });
        }

        else if (key === "training" && data.training && data.training.length > 0) {
            children.push(createSectionHeader("Training"));
            data.training.forEach((item: any) => {
                if (!item) return;

                // Row with Training Name (left) and Year (right)
                children.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borderlessTableBorders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 75, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: item.trainingName || "",
                                                        bold: true,
                                                        size: subTitleSize,
                                                        font: fontName,
                                                    }),
                                                ],
                                                spacing: { after: 30 },
                                            }),
                                        ],
                                    }),
                                    new TableCell({
                                        width: { size: 25, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: item.year || "",
                                                        size: normalTextSize,
                                                        font: fontName,
                                                        color: "777777",
                                                    }),
                                                ],
                                                alignment: AlignmentType.RIGHT,
                                                spacing: { after: 30 },
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                // Institute
                if (item.institute) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: item.institute,
                                    italics: true,
                                    size: normalTextSize,
                                    font: fontName,
                                    color: "555555",
                                }),
                            ],
                            spacing: { after: 60 },
                        })
                    );
                }

                // Bullets
                if (item.bullets && Array.isArray(item.bullets)) {
                    item.bullets.filter(Boolean).forEach((bullet: string) => {
                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: bullet,
                                        size: normalTextSize,
                                        font: fontName,
                                    }),
                                ],
                                bullet: { level: 0 },
                                spacing: { before: 20, after: 20 },
                            })
                        );
                    });
                }

                children.push(new Paragraph({ spacing: { after: 100 } }));
            });
        }

        else if (key === "education" && data.education && data.education.length > 0) {
            children.push(createSectionHeader("Education"));
            data.education.forEach((item: any) => {
                if (!item) return;

                const degreeText = item.degree + (item.department ? ` — ${item.department}` : "");

                // Row with Degree (left) and Year (right)
                children.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borderlessTableBorders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 75, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: degreeText || "",
                                                        bold: true,
                                                        size: subTitleSize,
                                                        font: fontName,
                                                    }),
                                                ],
                                                spacing: { after: 30 },
                                            }),
                                        ],
                                    }),
                                    new TableCell({
                                        width: { size: 25, type: WidthType.PERCENTAGE },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: item.year || "",
                                                        size: normalTextSize,
                                                        font: fontName,
                                                        color: "777777",
                                                    }),
                                                ],
                                                alignment: AlignmentType.RIGHT,
                                                spacing: { after: 30 },
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                // Institution
                if (item.institution) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: item.institution,
                                    italics: true,
                                    size: normalTextSize,
                                    font: fontName,
                                    color: "555555",
                                }),
                            ],
                            spacing: { after: 30 },
                        })
                    );
                }

                // GPA
                if (item.gpa) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `GPA: ${item.gpa}`,
                                    size: normalTextSize,
                                    font: fontName,
                                    color: "777777",
                                }),
                            ],
                            spacing: { after: 60 },
                        })
                    );
                }

                children.push(new Paragraph({ spacing: { after: 80 } }));
            });
        }

        else if (key === "skills" && data.skills && data.skills.length > 0) {
            children.push(createSectionHeader("Skills"));
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: data.skills.join(", "),
                            size: normalTextSize,
                            font: fontName,
                        }),
                    ],
                    spacing: { after: 120 },
                })
            );
        }

        else if (key === "languages" && data.languages && data.languages.length > 0) {
            children.push(createSectionHeader("Languages"));
            data.languages.forEach((item: any) => {
                if (!item) return;
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${item.name} (${item.level})`,
                                size: normalTextSize,
                                font: fontName,
                            }),
                        ],
                        bullet: { level: 0 },
                        spacing: { before: 20, after: 20 },
                    })
                );
            });
            children.push(new Paragraph({ spacing: { after: 80 } }));
        }

        else if (key === "hobbies" && data.hobbies && data.hobbies.length > 0) {
            children.push(createSectionHeader("Hobbies"));
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: data.hobbies.join(", "),
                            size: normalTextSize,
                            font: fontName,
                        }),
                    ],
                    spacing: { after: 120 },
                })
            );
        }

        else if (key === "personalInfo") {
            const personalFields = [
                { label: "Date of Birth", value: data.dateOfBirth },
                { label: "Blood Group", value: data.bloodGroup },
                { label: "Religion", value: data.religion },
                { label: "Marital Status", value: data.maritalStatus },
                { label: "Nationality", value: data.nationality },
            ].filter((f) => f.value);

            if (personalFields.length > 0) {
                children.push(createSectionHeader("Personal Information"));
                personalFields.forEach((field) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${field.label}: `,
                                    bold: true,
                                    size: normalTextSize,
                                    font: fontName,
                                }),
                                new TextRun({
                                    text: field.value || "",
                                    size: normalTextSize,
                                    font: fontName,
                                }),
                            ],
                            spacing: { before: 20, after: 20 },
                        })
                    );
                });
                children.push(new Paragraph({ spacing: { after: 80 } }));
            }
        }

        else if (key === "references" && data.references && data.references.length > 0) {
            children.push(createSectionHeader("References"));

            // Render side by side in groups of 2
            for (let i = 0; i < data.references.length; i += 2) {
                const ref1 = data.references[i];
                const ref2 = data.references[i + 1];

                const buildRefChildren = (ref: any) => {
                    const lines: Paragraph[] = [];
                    if (!ref) return lines;

                    lines.push(
                        new Paragraph({
                            children: [new TextRun({ text: ref.name || "", bold: true, size: subTitleSize, font: fontName })],
                            spacing: { after: 20 },
                        })
                    );
                    if (ref.title) {
                        lines.push(
                            new Paragraph({
                                children: [new TextRun({ text: ref.title, size: normalTextSize, font: fontName, color: "555555" })],
                                spacing: { after: 20 },
                            })
                        );
                    }
                    if (ref.organization) {
                        lines.push(
                            new Paragraph({
                                children: [new TextRun({ text: ref.organization, size: normalTextSize, font: fontName, color: "555555" })],
                                spacing: { after: 20 },
                            })
                        );
                    }
                    if (ref.phone) {
                        lines.push(
                            new Paragraph({
                                children: [new TextRun({ text: `Phone: ${ref.phone}`, size: normalTextSize, font: fontName, color: "777777" })],
                                spacing: { after: 20 },
                            })
                        );
                    }
                    if (ref.email) {
                        lines.push(
                            new Paragraph({
                                children: [new TextRun({ text: `Email: ${ref.email}`, size: normalTextSize, font: fontName, color: "777777" })],
                                spacing: { after: 20 },
                            })
                        );
                    }
                    return lines;
                };

                children.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: borderlessTableBorders,
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        children: buildRefChildren(ref1),
                                    }),
                                    new TableCell({
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        children: ref2 ? buildRefChildren(ref2) : [],
                                    }),
                                ],
                            }),
                        ],
                    })
                );

                children.push(new Paragraph({ spacing: { after: 100 } }));
            }
        }

        else if (key === "declaration" && data.declaration) {
            children.push(createSectionHeader("Declaration"));
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: data.declaration,
                            italics: true,
                            size: normalTextSize,
                            font: fontName,
                        }),
                    ],
                    spacing: { after: 150 },
                })
            );

            if (data.signature) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: data.signature,
                                bold: true,
                                size: subTitleSize,
                                font: fontName,
                            }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 100 },
                    })
                );
            }
        }
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children,
            },
        ],
    });

    return await Packer.toBuffer(doc);
}
