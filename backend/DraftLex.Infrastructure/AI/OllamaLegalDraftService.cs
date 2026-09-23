using DraftLex.Application.Common.AI;
using DraftLex.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace DraftLex.Infrastructure.AI;

public class OllamaLegalDraftService : IAILegalDraftService
{
    private readonly HttpClient _httpClient;
    private readonly string _modelName;

    public OllamaLegalDraftService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;

        _httpClient.BaseAddress = new Uri(
            configuration["Ollama:BaseUrl"] ?? "http://localhost:11434");

        _modelName = configuration["Ollama:Model"] ?? "llama3.1";
    }

    public async Task<string> GenerateLegalDraftAsync(
        string documentType,
        string clientName,
        string matterTitle,
        string court,
        string facts,
        string advocateName)
    {
        var prompt = $"""
You are DraftLex AI, an Indian legal drafting assistant.

Rules:
- Draft documents suitable for Indian legal practice.
- Never invent facts.
- Never accuse anyone of murder, rape, fraud, corruption, or any criminal offence unless those exact allegations appear in the supplied Facts.
- If information is missing, use neutral placeholders like [Recipient Name] or [Respondent Name].
- Use formal legal language.
- Do not use Markdown (#, ##, **).
- Produce plain text with proper paragraphs.

Document Type: {documentType}
Client: {clientName}
Matter: {matterTitle}
Court: {court}

Facts:
{facts}

If the document type is "Legal Notice", use exactly this structure.

LEGAL NOTICE

Date: {DateTime.Now:dd MMMM yyyy}

To:
[Recipient Name]
[Recipient Address]

Subject:
{matterTitle}

Sir/Madam,

Under the instructions of and on behalf of my client {clientName}, I hereby issue this legal notice.

Facts

Use only the supplied facts.

Legal Position

Explain the legal position in neutral language.

Demand

State the relief sought based on the supplied facts.

Time for Compliance

Provide 15 days for compliance.

Reservation of Rights

State that the client reserves all remedies available under applicable Indian law.

Yours faithfully,

{advocateName}
Advocate
[Bar Council No.]

Never fabricate criminal allegations.
""";

        var request = new OllamaGenerateRequest
        {
            Model = _modelName,
            Prompt = prompt,
            Stream = false
        };

        var response = await _httpClient.PostAsJsonAsync("/api/generate", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>();

        return result?.Response?.Trim() ?? "Unable to generate document.";
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