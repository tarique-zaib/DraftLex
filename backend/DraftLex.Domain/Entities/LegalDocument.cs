namespace DraftLex.Domain.Entities;

public class LegalDocument
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public Matter Matter { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string DocumentType { get; set; } = string.Empty;

    // Extracted/editable document text
    public string Content { get; set; } = string.Empty;

    // Physical uploaded filename stored under uploads/evidence
    public string? StoredFileName { get; set; }

    public int Version { get; set; } = 1;

    public string Status { get; set; } = "Draft";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}