namespace DraftLex.Application.DTOs.Clients;

public class ClientDocumentResponse
{
    public Guid Id { get; set; }
    public Guid MatterId { get; set; }
    public string MatterTitle { get; set; } = "";
    public string Title { get; set; } = "";
    public string DocumentType { get; set; } = "";
    public int Version { get; set; }
    public string Status { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}