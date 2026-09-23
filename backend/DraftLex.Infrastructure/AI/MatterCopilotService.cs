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
            configuration["Ollama:BaseUrl"] ?? "http://localhost:11434");

        _modelName = configuration["Ollama:Model"] ?? "llama3.1";
    }

    public async Task<CopilotChatResponse> ChatAsync(
        Guid matterId,
        string message,
        CancellationToken cancellationToken = default)
    {
        var matter = await _db.Matters
            .Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == matterId, cancellationToken);

        if (matter == null)
            throw new ArgumentException("Matter not found.");

        var hearings = await _db.Hearings
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.HearingDate)
            .ToListAsync(cancellationToken);

        var documents = await _db.LegalDocuments
            .Where(x => x.MatterId == matterId)
            .OrderByDescending(x => x.Version)
            .ToListAsync(cancellationToken);

        var timeline = await _db.TimelineEvents
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.EventDate)
            .ToListAsync(cancellationToken);

        var prompt = BuildPrompt(
            matter,
            hearings,
            documents,
            timeline,
            message);

        var request = new OllamaGenerateRequest
        {
            Model = _modelName,
            Prompt = prompt,
            Stream = false
        };

        var response = await _httpClient.PostAsJsonAsync(
            "/api/generate",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>(
            cancellationToken: cancellationToken);

        var reply = result?.Response?.Trim() ?? "No response received.";

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

    private static string BuildPrompt(
        Matter matter,
        List<Hearing> hearings,
        List<LegalDocument> documents,
        List<TimelineEvent> timeline,
        string question)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are DraftLex AI Matter Copilot.");
        sb.AppendLine("Answer ONLY using the provided matter context.");
        sb.AppendLine("Return plain text only.");
        sb.AppendLine();

        sb.AppendLine("Matter Summary");
        sb.AppendLine($"Matter Title: {matter.Title}");
        sb.AppendLine($"Matter Number: {matter.MatterNumber}");
        sb.AppendLine($"Matter Type: {matter.MatterType}");
        sb.AppendLine($"Court: {matter.Court}");
        sb.AppendLine($"Judge: {matter.JudgeName}");
        sb.AppendLine($"Client: {matter.Client.FullName}");
        sb.AppendLine($"Opposite Party: {matter.OppositePartyName}");
        sb.AppendLine();

        sb.AppendLine("Hearings");
        if (hearings.Any())
            hearings.ForEach(x =>
                sb.AppendLine($"{x.HearingDate:dd MMM yyyy}: {x.Stage}"));
        else
            sb.AppendLine("None");

        sb.AppendLine();

        sb.AppendLine("Documents");
        foreach (var d in documents
            .GroupBy(x => x.Title)
            .Select(g => g.OrderByDescending(x => x.Version).First()))
        {
            sb.AppendLine($"{d.Title} (v{d.Version})");
        }

        sb.AppendLine();

        sb.AppendLine("Timeline");
        timeline.ForEach(x =>
            sb.AppendLine($"{x.EventDate:dd MMM yyyy}: {x.Title}"));

        sb.AppendLine();
        sb.AppendLine("Lawyer Question");
        sb.AppendLine(question);

        return sb.ToString();
    }

    private class OllamaGenerateRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = "";

        [JsonPropertyName("prompt")]
        public string Prompt { get; set; } = "";

        [JsonPropertyName("stream")]
        public bool Stream { get; set; }
    }

    private class OllamaGenerateResponse
    {
        [JsonPropertyName("response")]
        public string Response { get; set; } = "";
    }
}