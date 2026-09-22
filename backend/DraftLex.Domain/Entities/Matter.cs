namespace DraftLex.Domain.Entities;

public class Matter
{
    public Guid Id { get; set; }

    

    public string MatterNumber { get; set; } = string.Empty;

    public Guid ClientId { get; set; }

    public Client Client { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string MatterType { get; set; } = string.Empty;

    public string Court { get; set; } = string.Empty;

    public string CaseNumber { get; set; } = string.Empty;

    public string JudgeName { get; set; } = string.Empty;

    public string Status { get; set; } = "Active";

    public ICollection<Hearing> Hearings { get; set; }
    = new List<Hearing>();

    public ICollection<TimelineEvent> TimelineEvents { get; set; }
    = new List<TimelineEvent>();

    public ICollection<LegalDocument> Documents { get; set; } = new List<LegalDocument>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}