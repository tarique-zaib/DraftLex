using System.Net.Http.Json;
using System.Text.Json;
using DraftLex.Application.Common.AI;
using Microsoft.Extensions.Options;

namespace DraftLex.Infrastructure.AI;

public class OllamaLegalDraftService : IAILegalDraftService
{
    private readonly HttpClient _http;
    private readonly OllamaSettings _settings;

    public OllamaLegalDraftService(
        HttpClient http,
        IOptions<OllamaSettings> options)
    {
        _http = http;
        _settings = options.Value;
    }

    public async Task<string> GenerateLegalDraftAsync(
        string documentType,
        string clientName,
        string matterTitle,
        string court,
        string facts)
    {
        var today = DateTime.Now.ToString("dd MMMM yyyy");
        var prompt = $"""
You are DraftLex AI, an assistant that helps advocates draft legal documents.

Task:
Prepare a first-draft {documentType} in a professional Indian legal drafting style.

This is a drafting assistance task for a legal professional.
Do not refuse the request.
Do not invent facts.
Do not invent statutory sections, case law, or legal citations.
If a legal provision is not provided, use neutral wording such as "under applicable Indian law".

Client Name: {clientName}
Matter: {matterTitle}
Court: {court}

Facts:
{facts}

Format:

# LEGAL NOTICE

**Date:** {today}

**To:**
[Recipient Name]
[Recipient Address]

**Subject:** {documentType}

## Facts

Summarize only the provided facts.

## Demand

State the client's demand clearly and professionally.

## Time for Compliance

State that the recipient is requested to respond or comply within [15] days.

## Reservation of Rights

State that the client reserves the right to pursue remedies available under applicable Indian law.

**Advocate**
[Advocate Name]
[Bar Council No.]
""";

        var response = await _http.PostAsJsonAsync(
            $"{_settings.BaseUrl}/api/generate",
            new
            {
                model = _settings.Model,
                prompt,
                stream = false
            });

        response.EnsureSuccessStatusCode();

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        return json.RootElement.GetProperty("response").GetString() ?? "";
    }
}