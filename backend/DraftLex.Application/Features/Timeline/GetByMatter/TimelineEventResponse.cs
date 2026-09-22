namespace DraftLex.Application.Features.Timeline.GetByMatter;

public class TimelineEventResponse
{
    public Guid Id { get; set; }

    public string EventType { get; set; } = "";

    public string Title { get; set; } = "";

    public string Description { get; set; } = "";

    public DateTime EventDate { get; set; }
}