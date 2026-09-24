namespace DraftLex.Application.Features.AI.GenerateAffidavit;

public class GenerateAffidavitResponse
{
    public string Title { get; set; } = "Affidavit";

    public string Court { get; set; } = string.Empty;

    public string MatterTitle { get; set; } = string.Empty;

    public string AffiantName { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string Verification { get; set; } = string.Empty;

    public DateTime GeneratedOn { get; set; } = DateTime.UtcNow;
}