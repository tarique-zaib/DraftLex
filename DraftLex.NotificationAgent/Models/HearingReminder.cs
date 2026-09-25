namespace DraftLex.NotificationAgent.Models;

public class HearingReminder
{
    public Guid Id { get; set; }

    public Guid MatterId { get; set; }

    public string MatterTitle { get; set; } = "";

    public DateTime HearingDate { get; set; }

    public string Stage { get; set; } = "";

    public string JudgeName { get; set; } = "";

    public string CourtRoom { get; set; } = "";

    public string Court { get; set; } = "";

    public string ClientName { get; set; } = "";
}