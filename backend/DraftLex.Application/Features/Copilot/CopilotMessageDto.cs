namespace DraftLex.Application.Features.Copilot;

public class CopilotMessageDto
{
    public string Role { get; set; } = "";

    public string Content { get; set; } = "";

    public DateTime CreatedAt { get; set; }
}