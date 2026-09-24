using DraftLex.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Net;
using System.Text.RegularExpressions;

namespace DraftLex.Api.Services;

public class PdfExportService
{
    public byte[] Generate(LegalDocument document)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var body = CleanHtml(document.Content);

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(45);

                // HEADER
                page.Header().Column(header =>
                {
                    header.Spacing(6);

                    header.Item()
                        .AlignCenter()
                        .Text($"IN THE COURT OF {(document.Matter?.Court ?? "DISTRICT COURT").ToUpper()}")
                        .Bold()
                        .FontSize(18);

                    header.Item()
                        .AlignCenter()
                        .Text(document.DocumentType.ToUpper())
                        .Bold()
                        .FontSize(16);

                    header.Item().PaddingTop(6).LineHorizontal(1);
                });

                // CONTENT
                page.Content().PaddingVertical(18).Column(column =>
                {
                    column.Spacing(12);

                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Text(text =>
                        {
                            text.Span("Matter: ").Bold();
                            text.Span(document.Matter?.Title ?? document.Title);
                        });

                        row.RelativeItem().AlignRight().Text(text =>
                        {
                            text.Span("Date: ").Bold();
                            text.Span(DateTime.Now.ToString("dd MMM yyyy"));
                        });
                    });

                    column.Item().Text(text =>
                    {
                        text.Span("Matter No: ").Bold();
                        text.Span(document.Matter?.MatterNumber ?? "N/A");
                    });

                    column.Item().Text(text =>
                    {
                        text.Span("Affiant: ").Bold();
                        text.Span(document.Matter?.Client?.FullName ?? "Deponent");
                    });

                    column.Item().PaddingVertical(6).LineHorizontal(0.5f);

                    foreach (var block in ParseBlocks(body))
                    {
                        switch (block.Type)
                        {
                            case BlockType.Paragraph:
                                column.Item().Text(block.Text)
                                    .FontSize(12)
                                    .LineHeight(1.6f)
                                    .Justify();
                                break;

                            case BlockType.Numbered:
                                column.Item().Row(row =>
                                {
                                    row.ConstantItem(20)
                                        .Text($"{block.Number}.")
                                        .Bold();

                                    row.RelativeItem()
                                        .Text(block.Text)
                                        .FontSize(12)
                                        .LineHeight(1.6f)
                                        .Justify();
                                });
                                break;

                            case BlockType.Bullet:
                                column.Item().Row(row =>
                                {
                                    row.ConstantItem(18).Text("•").Bold();

                                    row.RelativeItem()
                                        .Text(block.Text)
                                        .FontSize(12)
                                        .LineHeight(1.6f)
                                        .Justify();
                                });
                                break;
                        }
                    }

                    column.Item().PaddingTop(18);

                    column.Item().Text("VERIFICATION")
                        .Bold()
                        .FontSize(13);

                    column.Item().Text(
                        $"Verified at {document.Matter?.Court ?? "________"} on {DateTime.Now:dd MMM yyyy} that the contents of this affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed.")
                        .FontSize(12)
                        .LineHeight(1.5f);

                    column.Item().PaddingTop(24);

                    column.Item().AlignRight().Column(signature =>
                    {
                        signature.Item().Text("_____________________");
                        signature.Item().Text(document.Matter?.Client?.FullName ?? "Deponent").Bold();
                    });
                });

                // FOOTER
                page.Footer().Column(footer =>
                {
                    footer.Item().LineHorizontal(0.5f);

                    footer.Item().PaddingTop(6).Row(row =>
                    {
                        row.RelativeItem()
                            .Text("DraftLex Legal Management System")
                            .FontSize(9);

                        row.RelativeItem()
                            .AlignRight()
                            .Text(text =>
                            {
                                text.DefaultTextStyle(x => x.FontSize(9));
                                text.Span("Page ");
                                text.CurrentPageNumber();
                                text.Span(" of ");
                                text.TotalPages();
                            });
                    });
                });
            });
        }).GeneratePdf();
    }

    // =========================================================
    // HTML CLEANER
    // =========================================================

    private static string CleanHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return "";

        html = html.Replace("</p>", "\n\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("</li>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<li>", "", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<ol>", "", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("</ol>", "", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<ul>", "", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("</ul>", "", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase);

        html = Regex.Replace(html, "<[^>]+>", "");

        html = WebUtility.HtmlDecode(html);

        html = Regex.Replace(html, @"^\s*Affidavit\s*$", "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        html = Regex.Replace(html, @"^\s*Court:.*$", "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        html = Regex.Replace(html, @"^\s*Matter:.*$", "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        html = Regex.Replace(html, @"^\s*Affiant:.*$", "", RegexOptions.IgnoreCase | RegexOptions.Multiline);
        html = Regex.Replace(html, @"Verification[\s\S]*$", "", RegexOptions.IgnoreCase);
        html = Regex.Replace(html, @"^\s*Deponent\s*$", "", RegexOptions.IgnoreCase | RegexOptions.Multiline);

        html = Regex.Replace(html, @"\n{3,}", "\n\n");

        return html.Trim();
    }

    // =========================================================
    // PARSER
    // =========================================================

    private enum BlockType
    {
        Paragraph,
        Numbered,
        Bullet
    }

    private class Block
    {
        public BlockType Type { get; set; }
        public int Number { get; set; }
        public string Text { get; set; } = "";
    }

    private static List<Block> ParseBlocks(string text)
    {
        var blocks = new List<Block>();

        foreach (var line in text.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            var value = line.Trim();

            if (string.IsNullOrWhiteSpace(value))
                continue;

            var numbered = Regex.Match(value, @"^(\d+)\.\s*(.+)$");

            if (numbered.Success)
            {
                blocks.Add(new Block
                {
                    Type = BlockType.Numbered,
                    Number = int.Parse(numbered.Groups[1].Value),
                    Text = numbered.Groups[2].Value
                });

                continue;
            }

            if (value.StartsWith("•"))
            {
                blocks.Add(new Block
                {
                    Type = BlockType.Bullet,
                    Text = value.TrimStart('•', ' ')
                });

                continue;
            }

            blocks.Add(new Block
            {
                Type = BlockType.Paragraph,
                Text = value
            });
        }

        return blocks;
    }
}