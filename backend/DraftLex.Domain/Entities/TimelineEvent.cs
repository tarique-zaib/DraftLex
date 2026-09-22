namespace DraftLex.Domain.Entities;

public class TimelineEvent
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public Matter Matter { get; set; } = null!;

    public string EventType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime EventDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}