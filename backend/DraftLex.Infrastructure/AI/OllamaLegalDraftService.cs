using DraftLex.Application.Common.AI;
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
        string advocateName,
        string language)
    {
        var prompt = $"""
You are DraftLex AI, an Indian legal drafting assistant.

Your job is to draft court-ready legal documents used by Indian advocates.

General Rules:
- Draft documents suitable for Indian legal practice.
- Never invent facts.
- Never accuse anyone of murder, rape, fraud, corruption, or any criminal offence unless those exact allegations appear in the supplied Facts.
- Use only the supplied facts.
- If information is missing, use neutral placeholders like [Recipient Name] or [Respondent Name].
- Use formal legal language.
- Do not use Markdown (#, ##, **).
- Produce plain text with proper paragraphs.
- Preserve all names, courts, matter numbers and proper nouns exactly as provided.
- Never translate personal names such as Tarique Zaib, Naushaba or Rootbix.

Document Type: {documentType}
Output Language: {language}

Client: {clientName}
Matter: {matterTitle}
Court: {court}

Facts:
{facts}

LANGUAGE INSTRUCTIONS

If Output Language is "English":
- Draft entirely in formal Indian legal English.

If Output Language is "Hindi":
- Draft directly in professional Indian legal Hindi.
- Use Devanagari script only.
- Do NOT translate word-for-word from English.
- Use terminology commonly used by Indian advocates and courts.
- Start with "कानूनी नोटिस".
- Use these headings exactly:
  - दिनांक
  - प्रति
  - विषय
  - महोदय/महोदया,
  - तथ्य
  - विधिक स्थिति
  - मांग
  - अनुपालन हेतु समय
  - अधिकार सुरक्षित
  - भवदीय,

If Output Language is "Bilingual":
- Generate the complete Hindi version first.
- Insert a separator line.
- Generate the complete English version afterwards.

DOCUMENT TEMPLATE

If the document type is "Legal Notice", follow the selected language exactly.

========================
ENGLISH TEMPLATE
========================

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

Explain the legal position under applicable Indian law using neutral language.

Demand

State the relief sought based solely on the supplied facts.

Time for Compliance

Grant 15 days for compliance.

Reservation of Rights

State that the client reserves all remedies available under applicable Indian law.

Yours faithfully,

{advocateName}
Advocate
[Bar Council Registration No.]

========================
HINDI TEMPLATE
========================

कानूनी नोटिस

दिनांक: {DateTime.Now:dd MMMM yyyy}

प्रति:
[प्राप्तकर्ता का नाम]
[प्राप्तकर्ता का पता]

विषय:
{matterTitle}

महोदय/महोदया,

मेरे मुवक्किल {clientName} के निर्देशानुसार मैं आपको यह कानूनी नोटिस प्रेषित कर रहा हूँ।

तथ्य

केवल उपलब्ध तथ्यों का उपयोग करें।

विधिक स्थिति

भारतीय विधि के अनुसार उपलब्ध तथ्यों के आधार पर तटस्थ कानूनी स्थिति स्पष्ट करें।

मांग

उपलब्ध तथ्यों के आधार पर अपेक्षित राहत स्पष्ट करें।

अनुपालन हेतु समय

इस नोटिस की प्राप्ति से 15 दिनों के भीतर अनुपालन करने का अवसर प्रदान करें।

अधिकार सुरक्षित

मेरे मुवक्किल भारतीय विधि के अंतर्गत उपलब्ध सभी विधिक उपाय सुरक्षित रखते हैं।

भवदीय,

{advocateName}
अधिवक्ता
[बार काउंसिल पंजीकरण संख्या]

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