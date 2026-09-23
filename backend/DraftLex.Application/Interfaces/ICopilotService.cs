using DraftLex.Application.Features.Copilot;

namespace DraftLex.Application.Interfaces;

public interface ICopilotService
{
    Task<CopilotChatResponse> ChatAsync(
        Guid matterId,
        string message,
        CancellationToken cancellationToken = default);

    Task<List<CopilotMessageDto>> GetHistoryAsync(
        Guid matterId,
        CancellationToken cancellationToken = default);
}