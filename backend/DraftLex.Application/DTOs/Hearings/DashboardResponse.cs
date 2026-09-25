namespace DraftLex.Application.DTOs.Hearings;

public class DashboardResponse
{
    public List<DashboardHearingDto> Today { get; set; } = [];
    public List<DashboardHearingDto> Upcoming { get; set; } = [];
    public DashboardStatsDto Stats { get; set; } = new();
}

public class DashboardHearingDto
{
    public Guid Id { get; set; }
    public Guid MatterId { get; set; }
    public string MatterTitle { get; set; } = "";
    public string ClientName { get; set; } = "";
    public string Court { get; set; } = "";
    public DateTime HearingDate { get; set; }
    public string Stage { get; set; } = "";
}

public class DashboardStatsDto
{
    public int Clients { get; set; }
    public int ActiveMatters { get; set; }
    public int Hearings { get; set; }
    public int Documents { get; set; }
}