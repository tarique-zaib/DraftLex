namespace DraftLex.Application.Features.Documents.DTOs;

public class GenerateDocumentRequest
{
    public Guid MatterId { get; set; }
    public string DocumentType { get; set; } = "";
    public string Facts { get; set; } = "";
}