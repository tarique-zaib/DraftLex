using DocumentFormat.OpenXml.Packaging;
using DraftLex.Application.Interfaces;
using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace DraftLex.Infrastructure.Documents;

public class DocumentTextExtractor : IDocumentTextExtractor
{
    public async Task<string> ExtractTextAsync(
        string filePath,
        string extension,
        CancellationToken cancellationToken = default)
    {
        extension = extension.ToLowerInvariant();

        return extension switch
        {
            ".pdf" => await ExtractPdfAsync(filePath, cancellationToken),
            ".docx" => await ExtractDocxAsync(filePath, cancellationToken),

            ".jpg" or ".jpeg" or ".png" =>
                string.Empty,

            _ => throw new NotSupportedException(
                $"Text extraction is not supported for '{extension}'.")
        };
    }

    private static Task<string> ExtractPdfAsync(
        string filePath,
        CancellationToken cancellationToken)
    {
        var builder = new StringBuilder();

        using var document = PdfDocument.Open(filePath);

        foreach (var page in document.GetPages())
        {
            cancellationToken.ThrowIfCancellationRequested();

            var text = ContentOrderTextExtractor.GetText(page);

            if (!string.IsNullOrWhiteSpace(text))
            {
                builder.AppendLine(text);
                builder.AppendLine();
            }
        }

        return Task.FromResult(NormalizeText(builder.ToString()));
    }

    private static async Task<string> ExtractDocxAsync(
        string filePath,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await Task.Run(() =>
        {
            using var document =
                WordprocessingDocument.Open(filePath, false);

            var body = document.MainDocumentPart?
                .Document?
                .Body;

            if (body == null)
                return string.Empty;

            return NormalizeText(body.InnerText);
        }, cancellationToken);
    }

    private static string NormalizeText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var lines = text
            .Replace("\r\n", "\n")
            .Replace("\r", "\n")
            .Split('\n')
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x));

        return string.Join(
            Environment.NewLine,
            lines);
    }
}