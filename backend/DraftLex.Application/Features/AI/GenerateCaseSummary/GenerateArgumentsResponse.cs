namespace DraftLex.Application.Features.AI.GenerateArguments;

public class GenerateArgumentsResponse
{
    public string Title { get; set; } = string.Empty;

    public string Introduction { get; set; } = string.Empty;

    public List<string> Arguments { get; set; } = new();

    public string Conclusion { get; set; } = string.Empty;

    public DateTime? NextHearing { get; set; }
}