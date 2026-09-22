namespace DraftLex.Application.Features.Documents.DTOs;

public class CreateDocumentRequest
{
    public Guid MatterId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string DocumentType { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;
}