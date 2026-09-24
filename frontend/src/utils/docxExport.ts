import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

export interface DocxExportOptions {
  documentType: string;
  title: string;
  matterTitle: string;
  court?: string;
  client?: string;
  oppositePartyName?: string;
  oppositePartyAddress?: string;
  content: string;
  fileName?: string;
}

function parseHtmlToParagraphs(html: string): Paragraph[] {
  const div = document.createElement("div");
  div.innerHTML = html;

  const paragraphs: Paragraph[] = [];

  function parseNode(
    node: Node,
    bold = false,
    italic = false,
    underline = false,
  ): TextRun[] {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";

      if (!text.trim()) return [];

      return [
        new TextRun({
          text,
          bold,
          italics: italic,
          underline: underline ? {} : undefined,
        }),
      ];
    }

    if (!(node instanceof HTMLElement)) return [];

    const tag = node.tagName.toLowerCase();

    const nextBold = bold || tag === "strong" || tag === "b";
    const nextItalic = italic || tag === "em" || tag === "i";
    const nextUnderline = underline || tag === "u";

    return Array.from(node.childNodes).flatMap((child) =>
      parseNode(child, nextBold, nextItalic, nextUnderline),
    );
  }

  Array.from(div.children).forEach((element) => {
    const el = element as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "p") {
      const text = el.textContent?.trim() || "";

      if (
        text.toLowerCase() === "affidavit" ||
        text.startsWith("Court:") ||
        text.startsWith("Matter:") ||
        text.startsWith("Affiant:") ||
        text.toLowerCase() === "verification"
      ) {
        return;
      }

      paragraphs.push(
        new Paragraph({
          spacing: { after: 180 },
          children: parseNode(el),
        }),
      );
      return;
    }

    if (tag === "ol") {
      Array.from(el.children).forEach((li, index) => {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `${index + 1}. ${li.textContent?.trim() || ""}`,
              }),
            ],
          }),
        );
      });
      return;
    }

    if (tag === "ul") {
      Array.from(el.children).forEach((li) => {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 180 },
            children: [new TextRun(li.textContent?.trim() || "")],
          }),
        );
      });
      return;
    }

    if (tag === "hr") {
      paragraphs.push(new Paragraph({ spacing: { after: 240 } }));
    }
  });

  return paragraphs;
}

function buildAffidavit(options: DocxExportOptions): Paragraph[] {
  const cleaned = options.content
    .replace(/<p><strong>Affidavit<\/strong><\/p>/i, "")
    .replace(/<p><strong>Court:.*?<\/p>/i, "")
    .replace(/<p><strong>Verification<\/strong><\/p>[\s\S]*$/i, "")
    .replace(/<p>Deponent<\/p>[\s\S]*$/i, "");

  return [
    new Paragraph({
      text: "AFFIDAVIT",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
    }),

    ...(options.court
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `IN THE COURT OF ${options.court.toUpperCase()}`,
                bold: true,
              }),
            ],
          }),
        ]
      : []),

    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({ text: "Matter: ", bold: true }),
        new TextRun(options.matterTitle),
      ],
    }),

    new Paragraph({
      spacing: { after: 260 },
      children: [
        new TextRun({ text: "Affiant: ", bold: true }),
        new TextRun(options.client || "Deponent"),
      ],
    }),

    ...parseHtmlToParagraphs(cleaned),

    new Paragraph({ spacing: { before: 280, after: 180 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "VERIFICATION",
          bold: true,
        }),
      ],
      spacing: { after: 180 },
    }),

    new Paragraph({
      spacing: { after: 260 },
      children: [
        new TextRun(
          `Verified at ${options.court || "________"} on ${new Date().toLocaleDateString(
            "en-IN",
          )} that the contents of this affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed.`,
        ),
      ],
    }),

    new Paragraph({ spacing: { before: 280 } }),

    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun("_____________________")],
    }),

    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: options.client || "Deponent",
          bold: true,
        }),
      ],
    }),
  ];
}

function buildLegalNotice(options: DocxExportOptions): Paragraph[] {
  return [
    new Paragraph({
      text: "LEGAL NOTICE",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
    }),

    ...(options.court
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `IN THE COURT OF ${options.court.toUpperCase()}`,
                bold: true,
              }),
            ],
          }),
        ]
      : []),

    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: "Matter: ", bold: true }),
        new TextRun(options.matterTitle),
      ],
    }),

    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({ text: "Date: ", bold: true }),
        new TextRun(new Date().toLocaleDateString("en-IN")),
      ],
    }),

    ...(options.oppositePartyName
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "To,",
                bold: true,
              }),
            ],
          }),

          new Paragraph({
            children: [new TextRun(options.oppositePartyName)],
          }),

          new Paragraph({
            spacing: { after: 220 },
            children: [new TextRun(options.oppositePartyAddress || "")],
          }),
        ]
      : []),

    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: "Subject: ",
          bold: true,
        }),
        new TextRun(options.matterTitle),
      ],
    }),

    ...parseHtmlToParagraphs(options.content),

    new Paragraph({
      spacing: { before: 280 },
      children: [
        new TextRun({
          text: "Yours faithfully,",
          bold: true,
        }),
      ],
    }),

    new Paragraph({
      children: [new TextRun(options.client || "Advocate")],
    }),
  ];
}

export async function exportToDocx(options: DocxExportOptions) {
  const type = options.documentType.toLowerCase();

  const children = type.includes("affidavit")
    ? buildAffidavit(options)
    : type.includes("legal notice")
      ? buildLegalNotice(options)
      : [
          new Paragraph({
            text: options.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          ...parseHtmlToParagraphs(options.content),
        ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(
    blob,
    options.fileName ||
      `${options.documentType.replace(/\s+/g, "_")}_${options.matterTitle.replace(/\s+/g, "_")}.docx`,
  );
}
