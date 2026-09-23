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

        var originalContent = document.Content ?? string.Empty;
        var respondent = ExtractRecipient(originalContent);
        var cleanContent = CleanHtml(originalContent);

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(45);

                // ================= HEADER =================

                page.Header().Column(header =>
                {
                    header.Spacing(4);

                    header.Item()
                        .AlignCenter()
                        .Text("IN THE COURT OF")
                        .FontSize(18)
                        .Bold();

                    header.Item()
                        .AlignCenter()
                        .Text(document.Matter?.Court ?? "District Court")
                        .FontSize(12);

                    header.Item()
                        .PaddingTop(6)
                        .AlignCenter()
                        .Text(document.Title.ToUpper())
                        .FontSize(16)
                        .Bold();

                    header.Item()
                        .PaddingTop(8)
                        .LineHorizontal(1);
                });

                // ================= CONTENT =================

                page.Content().PaddingVertical(20).Column(column =>
                {
                    column.Spacing(10);

                    // ---------- Parties ----------

                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            left.Item()
                                .Text(document.Matter?.Client?.FullName ?? "Petitioner")
                                .Bold()
                                .FontSize(13);

                            left.Item()
                                .Text("Petitioner / Plaintiff")
                                .FontSize(10);
                        });

                        row.ConstantItem(70)
                            .AlignMiddle()
                            .Text("VERSUS")
                            .Bold()
                            .FontSize(14);

                        row.RelativeItem().AlignRight().Column(right =>
                        {
                            right.Item()
                                .AlignRight()
                                .Text(respondent)
                                .Bold()
                                .FontSize(13);

                            right.Item()
                                .AlignRight()
                                .Text("Respondent / Defendant")
                                .FontSize(10);
                        });
                    });

                    column.Item().LineHorizontal(1);

                    // ---------- Case Details ----------

                    column.Item().PaddingTop(8);

                    column.Item().Row(row =>
                    {
                        row.RelativeItem()
                            .Text($"Matter No: {document.Matter?.MatterNumber ?? "N/A"}");

                        row.RelativeItem()
                            .AlignRight()
                            .Text($"Date: {DateTime.Now:dd MMM yyyy}");
                    });

                    column.Item()
                        .Text($"Document Type: {document.DocumentType}");

                    column.Item()
                        .Text($"Version: {document.Version}");

                    column.Item().LineHorizontal(0.5f);

                    column.Item().PaddingTop(12);

                    // ---------- Body ----------

                    foreach (var paragraph in cleanContent.Split("\n\n"))
                    {
                        if (string.IsNullOrWhiteSpace(paragraph))
                            continue;

                        column.Item()
                            .Text(paragraph.Trim())
                            .FontSize(12)
                            .LineHeight(1.6f)
                            .Justify();
                    }

                    // ---------- Signature ----------

                    //column.Item()
                    //    .EnsureSpace(80)
                    //    .PaddingTop(25);

                    //column.Item().AlignRight().Column(signature =>
                    //{
                    //    signature.Spacing(2);

                    //    signature.Item().Text("_________________");
                    //    signature.Item().Text("Advocate");
                    //    signature.Item().Text("Tarique Zaib");
                    //});
                });

                // ================= FOOTER =================

                page.Footer().Column(footer =>
                {
                    footer.Item().LineHorizontal(0.5f);

                    footer.Item().PaddingTop(5).Row(row =>
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
    // Helpers
    // =========================================================

    private static string CleanHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return "";

        // Preserve paragraph breaks
        html = html.Replace("</p>", "\n\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase);

        // Remove HTML tags
        html = Regex.Replace(html, "<[^>]+>", "");

        // Decode entities
        html = WebUtility.HtmlDecode(html);

        // Remove markdown bold
        html = Regex.Replace(html, @"\*\*(.*?)\*\*", "$1");

        // Remove markdown headings
        html = Regex.Replace(html, @"(?m)^#{1,6}\s*", "");

        // Remove inline ##
        html = html.Replace("##", "");

        // Remove first occurrence of LEGAL NOTICE heading
        html = new Regex(
            @"^\s*LEGAL NOTICE\s*$",
            RegexOptions.IgnoreCase | RegexOptions.Multiline)
            .Replace(html, "", 1);

        // Remove Date line (already shown in header)
        html = Regex.Replace(
            html,
            @"(?im)^Date:\s*.*$",
            "");

        // Remove To block
        html = Regex.Replace(
            html,
            @"(?is)To:\s*.*?(?=Subject:)",
            "");

        // Remove Subject line
        html = Regex.Replace(
            html,
            @"(?im)^Subject:\s*$",
            "");

        // Remove duplicate advocate placeholder
        html = Regex.Replace(
            html,
            @"Advocate\s*\[Advocate Name\]\s*\[Bar Council No\.\]",
            "",
            RegexOptions.IgnoreCase);

        // Normalize blank lines
        html = Regex.Replace(html, @"\n{3,}", "\n\n");

        return html.Trim();
    }

    private static string ExtractRecipient(string text)
    {
        var match = Regex.Match(
            text,
            @"To:\s*(.+)",
            RegexOptions.IgnoreCase);

        if (!match.Success)
            return "Respondent";

        var recipient = match.Groups[1].Value.Trim();

        recipient = recipient.Replace("[Recipient Address]", "").Trim();

        if (recipient.Contains("[Recipient Name]", StringComparison.OrdinalIgnoreCase))
            return "Respondent";

        return string.IsNullOrWhiteSpace(recipient)
            ? "Respondent"
            : recipient;
    }
}