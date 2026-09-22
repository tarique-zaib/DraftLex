namespace DraftLex.Domain.Entities;

public class Hearing
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public Matter Matter { get; set; } = null!;

    public DateTime HearingDate { get; set; }

    public string CourtRoom { get; set; } = string.Empty;

    public string JudgeName { get; set; } = string.Empty;

    public string Stage { get; set; } = string.Empty;

    public string Remarks { get; set; } = string.Empty;

    public DateTime? NextHearingDate { get; set; }

    public bool IsCancelled { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}