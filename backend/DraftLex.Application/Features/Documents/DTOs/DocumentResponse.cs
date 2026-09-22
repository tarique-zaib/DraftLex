namespace DraftLex.Application.Features.Documents.DTOs;

public class DocumentResponse
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public string Title { get; set; } = "";

    public string DocumentType { get; set; } = "";

    public string Content { get; set; } = "";

    public int Version { get; set; }

    public string Status { get; set; } = "";

    public DateTime UpdatedAt { get; set; }
}