namespace DraftLex.Application.Features.Documents.DTOs;

public class UpdateDocumentRequest
{
    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public string Status { get; set; } = "Draft";
}