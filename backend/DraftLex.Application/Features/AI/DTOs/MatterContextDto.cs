namespace DraftLex.Application.Features.AI.DTOs;

public class MatterContextDto
{
    public Guid MatterId { get; set; }
    public string MatterNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public string ClientName { get; set; } = "";
    public string Court { get; set; } = "";
    public string CaseNumber { get; set; } = "";
    public string JudgeName { get; set; } = "";
    public string OppositePartyName { get; set; } = "";
    public string Status { get; set; } = "";
    public string Stage { get; set; } = "";
    public string Facts { get; set; } = "";
}