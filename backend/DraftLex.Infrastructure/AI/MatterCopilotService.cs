using DraftLex.Application.Features.Copilot;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;

namespace DraftLex.Infrastructure.AI;

public class MatterCopilotService : ICopilotService
{
    private readonly IDraftLexDbContext _db;
    private readonly HttpClient _httpClient;
    private readonly string _modelName;

    public MatterCopilotService(
        IDraftLexDbContext db,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _db = db;
        _httpClient = httpClient;

        _httpClient.BaseAddress = new Uri(
            configuration["Ollama:BaseUrl"]
            ?? "http://localhost:11434");

        _httpClient.Timeout = TimeSpan.FromMinutes(5);

        _modelName = configuration["Ollama:Model"]
            ?? "qwen2.5:7b";
    }

    public async Task<CopilotChatResponse> ChatAsync(
        Guid matterId,
        string message,
        List<Guid> documentIds,
        CancellationToken cancellationToken = default)
    {
        var matter = await _db.Matters
            .Include(x => x.Client)
            .FirstOrDefaultAsync(
                x => x.Id == matterId,
                cancellationToken);

        if (matter == null)
            throw new ArgumentException("Matter not found.");

        var hearings = await _db.Hearings
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.HearingDate)
            .ToListAsync(cancellationToken);

        var allDocuments = await _db.LegalDocuments
            .Where(x => x.MatterId == matterId)
            .OrderByDescending(x => x.Version)
            .ToListAsync(cancellationToken);

        /*
         * Only use documents explicitly selected by the user.
         */
        var selectedDocuments = allDocuments
            .Where(x => documentIds.Contains(x.Id))
            .ToList();

        var timeline = await _db.TimelineEvents
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.EventDate)
            .ToListAsync(cancellationToken);

        /*
         * ----------------------------------------------------------
         * STAGE 1
         * Extract ONLY explicit facts from the selected documents.
         * ----------------------------------------------------------
         */
        var factsPrompt = BuildFactsPrompt(
            selectedDocuments,
            message);

        var extractedFacts = await GenerateAsync(
            factsPrompt,
            cancellationToken);

        /*
         * ----------------------------------------------------------
         * STAGE 2
         * Generate the actual answer using ONLY the extracted facts
         * plus the matter information.
         * ----------------------------------------------------------
         */
        var finalPrompt = BuildFinalPrompt(
            matter,
            hearings,
            selectedDocuments,
            timeline,
            extractedFacts,
            message);

        var reply = await GenerateAsync(
            finalPrompt,
            cancellationToken);

        if (string.IsNullOrWhiteSpace(reply))
            reply = "No response received.";

        _db.CopilotMessages.Add(new CopilotMessage
        {
            Id = Guid.NewGuid(),
            MatterId = matterId,
            Role = "user",
            Content = message,
            CreatedAt = DateTime.UtcNow
        });

        _db.CopilotMessages.Add(new CopilotMessage
        {
            Id = Guid.NewGuid(),
            MatterId = matterId,
            Role = "assistant",
            Content = reply,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);

        return new CopilotChatResponse
        {
            Reply = reply
        };
    }

    public async Task<List<CopilotMessageDto>> GetHistoryAsync(
        Guid matterId,
        CancellationToken cancellationToken = default)
    {
        return await _db.CopilotMessages
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new CopilotMessageDto
            {
                Role = x.Role,
                Content = x.Content,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    // ============================================================
    // STAGE 1: EXTRACT EXPLICIT FACTS
    // ============================================================

    private static string BuildFactsPrompt(
        List<LegalDocument> documents,
        string question)
    {
        var sb = new StringBuilder();

        sb.AppendLine(
            "You are a factual evidence extraction engine for DraftLex.");

        sb.AppendLine();

        sb.AppendLine("IMPORTANT RULES:");

        sb.AppendLine(
            "1. Extract ONLY facts explicitly stated in the supplied documents.");

        sb.AppendLine(
            "2. Do NOT infer facts.");

        sb.AppendLine(
            "3. Do NOT add plausible or common facts.");

        sb.AppendLine(
            "4. Do NOT ask questions.");

        sb.AppendLine(
            "5. Do NOT provide legal advice.");

        sb.AppendLine(
            "6. Do NOT interpret the testimony.");

        sb.AppendLine(
            "7. Do NOT create facts from missing information.");

        sb.AppendLine(
            "8. Preserve dates, times, locations, people, actions and descriptions exactly as stated.");

        sb.AppendLine(
            "9. If something is not stated, it must NOT appear in the extracted facts.");

        sb.AppendLine(
            "10. Return only a numbered list of explicit factual statements.");

        sb.AppendLine();

        sb.AppendLine("===== SELECTED DOCUMENTS =====");

        if (!documents.Any())
        {
            sb.AppendLine(
                "No documents were selected.");
        }
        else
        {
            foreach (var document in documents
                .GroupBy(x => x.Title)
                .Select(g =>
                    g.OrderByDescending(x => x.Version).First()))
            {
                sb.AppendLine();
                sb.AppendLine(
                    $"--- DOCUMENT: {document.Title} ---");

                if (string.IsNullOrWhiteSpace(document.Content))
                {
                    sb.AppendLine(
                        "[No extracted text is available.]");
                }
                else
                {
                    sb.AppendLine(document.Content);
                }

                sb.AppendLine(
                    $"--- END DOCUMENT: {document.Title} ---");
            }
        }

        sb.AppendLine();

        sb.AppendLine("===== LAWYER REQUEST =====");
        sb.AppendLine(question);

        sb.AppendLine();

        sb.AppendLine("===== OUTPUT =====");
        sb.AppendLine(
            "Extract only explicit factual statements from the selected documents.");

        return sb.ToString();
    }

    // ============================================================
    // STAGE 2: FINAL COPILOT RESPONSE
    // ============================================================

    private static string BuildFinalPrompt(
        Matter matter,
        List<Hearing> hearings,
        List<LegalDocument> documents,
        List<TimelineEvent> timeline,
        string extractedFacts,
        string question)
    {
        var sb = new StringBuilder();

        sb.AppendLine(
            "You are DraftLex AI Matter Copilot.");

        sb.AppendLine(
            "You are assisting a lawyer with legal document analysis and drafting.");

        sb.AppendLine();

        sb.AppendLine("===== ABSOLUTE SOURCE-GROUNDING RULES =====");

        sb.AppendLine(
            "1. The extracted facts below are the factual foundation for the response.");

        sb.AppendLine(
            "2. You MUST NOT introduce a factual premise that is absent from the extracted facts.");

        sb.AppendLine(
            "3. Do NOT infer missing facts.");

        sb.AppendLine(
            "4. Do NOT invent facts merely because they would be useful in cross-examination.");

        sb.AppendLine(
            "5. Do NOT invent people, witnesses, distances, addresses, conversations, delays, clothing, objects, motives, actions, relationships, or events.");

        sb.AppendLine(
            "6. If a detail is not contained in the extracted facts, do not state that detail as fact.");

        sb.AppendLine(
            "7. A question may ask the witness to clarify a fact already mentioned, but must not assume an answer to an unstated fact.");

        sb.AppendLine(
            "8. If the testimony states that something happened, do not create a question assuming that the opposite happened.");

        sb.AppendLine(
            "9. Do not manufacture contradictions.");

        sb.AppendLine(
            "10. Do not turn missing information into an allegation.");

        sb.AppendLine(
            "11. Do not use general knowledge as evidence.");

        sb.AppendLine(
            "12. Return the requested draft directly.");

        sb.AppendLine(
            "13. Return plain text only.");

        sb.AppendLine();

        sb.AppendLine("===== MATTER =====");

        sb.AppendLine(
            $"Matter Title: {matter.Title}");

        sb.AppendLine(
            $"Matter Number: {matter.MatterNumber}");

        sb.AppendLine(
            $"Matter Type: {matter.MatterType}");

        sb.AppendLine(
            $"Court: {matter.Court}");

        sb.AppendLine(
            $"Judge: {matter.JudgeName}");

        sb.AppendLine(
            $"Client: {matter.Client.FullName}");

        sb.AppendLine(
            $"Opposite Party: {matter.OppositePartyName}");

        sb.AppendLine();

        sb.AppendLine("===== HEARINGS =====");

        if (hearings.Any())
        {
            foreach (var hearing in hearings)
            {
                sb.AppendLine(
                    $"{hearing.HearingDate:dd MMM yyyy}: {hearing.Stage}");
            }
        }
        else
        {
            sb.AppendLine("None");
        }

        sb.AppendLine();

        sb.AppendLine("===== SELECTED DOCUMENTS =====");

        if (!documents.Any())
        {
            sb.AppendLine(
                "No documents were selected by the lawyer.");
        }
        else
        {
            foreach (var document in documents
                .GroupBy(x => x.Title)
                .Select(g =>
                    g.OrderByDescending(x => x.Version).First()))
            {
                sb.AppendLine();

                sb.AppendLine(
                    $"--- DOCUMENT: {document.Title} ---");

                sb.AppendLine(
                    $"Document Type: {document.DocumentType}");

                sb.AppendLine(
                    $"Version: {document.Version}");

                sb.AppendLine(
                    $"Status: {document.Status}");

                sb.AppendLine();

                if (string.IsNullOrWhiteSpace(document.Content))
                {
                    sb.AppendLine(
                        "[No extracted text is available for this document.]");
                }
                else
                {
                    sb.AppendLine(document.Content);
                }

                sb.AppendLine();

                sb.AppendLine(
                    $"--- END DOCUMENT: {document.Title} ---");
            }
        }

        sb.AppendLine();

        sb.AppendLine("===== EXTRACTED FACTS =====");

        if (string.IsNullOrWhiteSpace(extractedFacts))
        {
            sb.AppendLine(
                "No explicit facts could be extracted.");
        }
        else
        {
            sb.AppendLine(extractedFacts);
        }

        sb.AppendLine();

        sb.AppendLine("===== MATTER TIMELINE =====");

        if (timeline.Any())
        {
            foreach (var item in timeline)
            {
                sb.AppendLine(
                    $"{item.EventDate:dd MMM yyyy}: {item.Title}");
            }
        }
        else
        {
            sb.AppendLine("None");
        }

        sb.AppendLine();

        sb.AppendLine("===== LAWYER QUESTION =====");

        sb.AppendLine(question);

        sb.AppendLine();

        sb.AppendLine("===== CROSS-EXAMINATION INSTRUCTIONS =====");

        sb.AppendLine(
            "If the lawyer requests cross-examination questions:");

        sb.AppendLine(
            "A. Use only the extracted factual statements.");

        sb.AppendLine(
            "B. You may ask the witness to confirm something explicitly stated.");

        sb.AppendLine(
            "C. You may ask for clarification of a detail that is explicitly mentioned but not fully specified.");

        sb.AppendLine(
            "D. You may explore the basis of an observation or identification only where the testimony itself contains that observation or identification.");

        sb.AppendLine(
            "E. Do not introduce a new factual premise.");

        sb.AppendLine(
            "F. Do not ask about people, events, distances, addresses, objects, conversations, delays or circumstances that are not stated.");

        sb.AppendLine(
            "G. Do not imply that a delay occurred when the testimony says the police were informed on the same night.");

        sb.AppendLine(
            "H. Do not ask whether the black bag was open, closed, large, small or contained anything unless the supplied evidence states such facts.");

        sb.AppendLine(
            "I. Do not ask whether other people were present unless the supplied evidence states that other people were present.");

        sb.AppendLine(
            "J. Do not ask about previous interactions with the accused unless the supplied evidence mentions such interactions.");

        sb.AppendLine();

        sb.AppendLine("===== FINAL VALIDATION =====");

        sb.AppendLine(
            "Before returning each question, verify that every factual premise in that question appears in the extracted facts.");

        sb.AppendLine(
            "If it does not appear in the extracted facts, remove the premise.");

        sb.AppendLine(
            "If a useful line of questioning requires an unknown fact, do not invent it.");

        sb.AppendLine(
            "Return only the requested answer.");

        return sb.ToString();
    }

    // ============================================================
    // OLLAMA
    // ============================================================

    private async Task<string> GenerateAsync(
     string prompt,
     CancellationToken cancellationToken)
    {
        var request = new OllamaGenerateRequest
        {
            Model = _modelName,
            Prompt = prompt,
            Stream = false,
            Options = new OllamaOptions
            {
                Temperature = 0.1
            }
        };

        using var ollamaCts = new CancellationTokenSource(
            TimeSpan.FromMinutes(10));

        var response = await _httpClient.PostAsJsonAsync(
            "/api/generate",
            request,
            ollamaCts.Token);

        response.EnsureSuccessStatusCode();

        var result =
            await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>(
                cancellationToken: ollamaCts.Token);

        return result?.Response?.Trim()
            ?? string.Empty;
    }

    private class OllamaGenerateRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = "";

        [JsonPropertyName("prompt")]
        public string Prompt { get; set; } = "";

        [JsonPropertyName("stream")]
        public bool Stream { get; set; }

        [JsonPropertyName("options")]
        public OllamaOptions Options { get; set; } = new();
    }

    private class OllamaOptions
    {
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }
    }

    private class OllamaGenerateResponse
    {
        [JsonPropertyName("response")]
        public string Response { get; set; } = "";
    }
}