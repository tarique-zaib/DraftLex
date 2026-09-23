namespace DraftLex.Application.Features.Copilot;

public class CopilotChatRequest
{
    public Guid MatterId { get; set; }

    public string Message { get; set; } = "";
}