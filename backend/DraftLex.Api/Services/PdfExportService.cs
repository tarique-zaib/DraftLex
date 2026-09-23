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

        var cleanContent = CleanHtml(document.Content);

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
                    column.Spacing(12);

                    // ---------- FROM / TO ----------

                    column.Item().Column(party =>
                    {
                        party.Spacing(8);

                        party.Item()
                            .Text("FROM")
                            .Bold()
                            .FontSize(12);

                        party.Item()
                            .Text(document.Matter?.Client?.FullName ?? "Client")
                            .FontSize(12);

                        party.Item().LineHorizontal(0.5f);

                        party.Item()
                            .Text("TO")
                            .Bold()
                            .FontSize(12);

                        party.Item()
                            .Text(document.Matter?.OppositePartyName ?? "Recipient")
                            .FontSize(12);

                        if (!string.IsNullOrWhiteSpace(document.Matter?.OppositePartyAddress))
                        {
                            party.Item()
                                .Text(document.Matter.OppositePartyAddress)
                                .FontSize(11);
                        }
                    });

                    column.Item().LineHorizontal(1);

                    // ---------- Case Details ----------

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

                    // ---------- Subject ----------

                    column.Item()
                        .PaddingTop(8)
                        .Text($"Subject: {document.Matter?.Title ?? document.Title}")
                        .Bold()
                        .FontSize(12);

                    column.Item().PaddingTop(6);

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

        html = html.Replace("</p>", "\n\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase);
        html = html.Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase);

        html = Regex.Replace(html, "<[^>]+>", "");

        html = WebUtility.HtmlDecode(html);

        html = Regex.Replace(html, @"\*\*(.*?)\*\*", "$1");

        html = Regex.Replace(html, @"(?m)^#{1,6}\s*", "");

        html = html.Replace("##", "");

        html = new Regex(
            @"^\s*LEGAL NOTICE\s*$",
            RegexOptions.IgnoreCase | RegexOptions.Multiline)
            .Replace(html, "", 1);

        html = Regex.Replace(
            html,
            @"(?im)^Date:\s*.*$",
            "");

        html = Regex.Replace(
            html,
            @"(?is)To:\s*.*?(?=Subject:)",
            "");

        html = Regex.Replace(
            html,
            @"(?im)^Subject:\s*.*$",
            "");

        html = Regex.Replace(
            html,
            @"Advocate\s*\[Advocate Name\]\s*\[Bar Council No\.\]",
            "",
            RegexOptions.IgnoreCase);

        html = Regex.Replace(html, @"\n{3,}", "\n\n");

        return html.Trim();
    }
}