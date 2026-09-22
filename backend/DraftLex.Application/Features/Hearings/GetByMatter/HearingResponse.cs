namespace DraftLex.Application.Features.Hearings.GetByMatter;

public class HearingResponse
{
    public Guid Id { get; set; }

    public DateTime HearingDate { get; set; }

    public string CourtRoom { get; set; } = "";

    public string JudgeName { get; set; } = "";

    public string Stage { get; set; } = "";

    public string Remarks { get; set; } = "";

    public DateTime? NextHearingDate { get; set; }
}