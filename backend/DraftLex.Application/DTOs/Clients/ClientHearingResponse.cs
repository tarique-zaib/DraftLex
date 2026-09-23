namespace DraftLex.Application.DTOs.Clients;

public class ClientHearingResponse
{
    public Guid Id { get; set; }
    public Guid MatterId { get; set; }
    public string MatterTitle { get; set; } = "";
    public DateTime HearingDate { get; set; }
    public string Stage { get; set; } = "";
    public string JudgeName { get; set; } = "";
    public string CourtRoom { get; set; } = "";
}