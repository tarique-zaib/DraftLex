namespace DraftLex.Application.Interfaces;

public interface IDocumentTextExtractor
{
    Task<string> ExtractTextAsync(
        string filePath,
        string extension,
        CancellationToken cancellationToken = default);
}