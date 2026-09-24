namespace DraftLex.Application.Features.Hearings.GetById;

public class GetHearingByIdResponse
{
    public Guid Id { get; set; }
    public Guid MatterId { get; set; }
    public string MatterTitle { get; set; } = string.Empty;
    public DateTime HearingDate { get; set; }
    public string Stage { get; set; } = string.Empty;
    public string JudgeName { get; set; } = string.Empty;
    public string CourtRoom { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}