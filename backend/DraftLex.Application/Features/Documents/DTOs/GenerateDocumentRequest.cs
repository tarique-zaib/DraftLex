namespace DraftLex.Application.Features.Documents.DTOs;

public class GenerateDocumentRequest
{
    public Guid MatterId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string MatterTitle { get; set; } = string.Empty;
    public string Court { get; set; } = string.Empty;
    public string Facts { get; set; } = string.Empty;
}