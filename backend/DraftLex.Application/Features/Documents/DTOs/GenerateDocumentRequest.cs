namespace DraftLex.Application.Features.Documents.DTOs;

public class GenerateDocumentRequest
{
    public Guid MatterId { get; set; }

    public string DocumentType { get; set; } = "Legal Notice";

    public string Facts { get; set; } = "";
    public string Language { get; set; } = "English";
}