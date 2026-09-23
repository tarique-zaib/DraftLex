namespace DraftLex.Domain.Entities;

public class LegalClause
{
    public Guid Id { get; set; }

    public string Title { get; set; } = "";

    public string Category { get; set; } = "";

    public string Content { get; set; } = "";

    public bool IsSystemClause { get; set; } = true;

    public Guid? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}