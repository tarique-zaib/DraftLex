namespace DraftLex.Application.Features.AI.GenerateCaseSummary;

public class GenerateCaseSummaryResponse
{
    public string Summary { get; set; } = string.Empty;

    public List<string> KeyFacts { get; set; } = new();

    public string RiskLevel { get; set; } = "Low";

    public string NextAction { get; set; } = string.Empty;

    public DateTime? NextHearing { get; set; }
}