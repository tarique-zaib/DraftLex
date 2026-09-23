namespace DraftLex.Application.Common.AI;

public interface IAILegalDraftService
{
    Task<string> GenerateLegalDraftAsync(
        string documentType,
        string clientName,
        string matterTitle,
        string court,
        string facts,
        string advocateName,
        string language);
}