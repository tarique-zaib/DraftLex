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

        _modelName = configuration["Ollama:Model"] ?? "qwen2.5:3b";
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
        var prompt = BuildPrompt(
            documentType,
            clientName,
            matterTitle,
            court,
            facts,
            advocateName,
            language);

        var request = new OllamaGenerateRequest
        {
            Model = _modelName,
            Prompt = prompt,
            Stream = false
        };

        var response = await _httpClient.PostAsJsonAsync("/api/generate", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>();

        var draft = result?.Response?.Trim() ?? "Unable to generate document.";

        var reviewPrompt = $"""
You are reviewing an Indian legal draft.

Original supplied facts:

{facts}

Draft:

{draft}

Instructions:

- Delete every sentence that is NOT directly supported by the supplied facts.
- Do not add new facts.
- Preserve formatting.
- Return ONLY the corrected draft.
""";

        var reviewResponse = await _httpClient.PostAsJsonAsync("/api/generate",
            new OllamaGenerateRequest
            {
                Model = _modelName,
                Prompt = reviewPrompt,
                Stream = false
            });

        reviewResponse.EnsureSuccessStatusCode();

        var reviewed = await reviewResponse.Content.ReadFromJsonAsync<OllamaGenerateResponse>();

        return reviewed?.Response?.Trim() ?? draft;
    }

    private string BuildPrompt(
    string documentType,
    string clientName,
    string matterTitle,
    string court,
    string facts,
    string advocateName,
    string language)
    {
        var isHindi = language.Equals("Hindi", StringComparison.OrdinalIgnoreCase);

        return documentType switch
        {
            "Affidavit" => BuildAffidavitPrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Plaint" => BuildPlaintPrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Written Statement" => BuildWrittenStatementPrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Legal Notice" => BuildLegalNoticePrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Reply Notice" => BuildReplyNoticePrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Bail Application" => BuildBailPrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Arguments" => BuildArgumentsPrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            "Case Summary" => BuildCaseSummaryPrompt(clientName, matterTitle, court, facts, advocateName, isHindi),

            _ => BuildGenericPrompt(clientName, matterTitle, court, facts, advocateName, isHindi)
        };
    }

    private string CommonRules(bool isHindi)
    {
        return isHindi
            ? """
आप DraftLex AI हैं।

आप भारत के वरिष्ठ अधिवक्ता हैं।

अनिवार्य नियम:

- केवल उपलब्ध तथ्यों का उपयोग करें।
- कोई नया तथ्य, आरोप, पता, पिता का नाम, आयु, व्यवसाय या संपत्ति न जोड़ें।
- यदि कोई जानकारी उपलब्ध नहीं है तो उसे छोड़ दें।
- भारतीय न्यायालयों में प्रचलित विधिक भाषा का प्रयोग करें।
- सभी नाम, न्यायालय तथा वाद शीर्षक यथावत रखें।
- Markdown का प्रयोग बिल्कुल न करें।
- केवल अंतिम दस्तावेज़ लौटाएँ।
"""
            : """
You are DraftLex AI.

You are a Senior Indian Advocate.

Mandatory Rules:

- Use ONLY the supplied facts.
- Never invent names, addresses, dates, occupations, family details or allegations.
- If information is missing, omit it.
- Preserve all names, courts and matter titles exactly.
- Use formal Indian court drafting language.
- Return ONLY the final document.
- No Markdown.
""";
    }

    private string BuildAffidavitPrompt(
    string client,
    string matter,
    string court,
    string facts,
    string advocate,
    bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: भारतीय न्यायालय हेतु शपथपत्र (Affidavit) तैयार करें।

महत्वपूर्ण नियम:
- केवल नीचे दिए गए तथ्यों का उपयोग करें।
- कोई नया तथ्य, पिता का नाम, पता, आयु, गिरफ्तारी, संपत्ति, परिवार या आरोप न जोड़ें।
- यदि कोई जानकारी उपलब्ध नहीं है तो उसे छोड़ दें।
- "मैं शपथकर्ता हूँ" जैसे अनावश्यक अनुच्छेद न जोड़ें।
- प्रत्येक वास्तविक तथ्य को अलग क्रमांकित अनुच्छेद में लिखें।
- अंत में "प्रार्थना" और "शपथकर्ता" अवश्य दें।
- "सत्यापन / Verification" न जोड़ें।

शपथकर्ता: {client}
वाद: {matter}
न्यायालय: {court}

दिए गए तथ्य:
{facts}

आउटपुट प्रारूप:

शपथपत्र

मैं, {client}, एतद्द्वारा शपथपूर्वक निम्नलिखित कथन करता/करती हूँ—

1. (पहला वास्तविक तथ्य)
2. (दूसरा वास्तविक तथ्य)
3. (आगे केवल उपलब्ध तथ्य)

प्रार्थना

अतः माननीय न्यायालय से निवेदन है कि इस शपथपत्र को अभिलेख पर ग्रहण किया जाए।

शपथकर्ता

{client}

यदि केवल एक तथ्य दिया गया है, तो केवल एक क्रमांकित अनुच्छेद लिखें।
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft an Indian Court Affidavit.

CRITICAL RULES:
- Use ONLY the supplied facts.
- Never invent names, addresses, age, occupation, custody status or allegations.
- Do not add generic paragraphs like "I am the deponent."
- Convert every supplied fact into a numbered affidavit paragraph.
- Do not add Verification.
- End with Prayer and Deponent.

Deponent: {client}
Matter: {matter}
Court: {court}

SUPPLIED FACTS:
{facts}

Required Output:

AFFIDAVIT

I, {client}, do hereby solemnly affirm and state as under:

1. (First supplied fact)
2. (Second supplied fact)
3. (Continue only with supplied facts.)

PRAYER

It is respectfully prayed that this affidavit be taken on record by this Hon'ble Court.

DEPONENT

{client}

If only one factual point exists, produce only one numbered paragraph.
""";
    }

    private string BuildPlaintPrompt(
    string client,
    string matter,
    string court,
    string facts,
    string advocate,
    bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: भारतीय न्यायालय के लिए वाद पत्र (Plaint) तैयार करें।

महत्वपूर्ण नियम:
- केवल दिए गए तथ्यों का उपयोग करें।
- कोई नया तथ्य, आरोप, पता, पिता का नाम, तिथि या कानून स्वयं न जोड़ें।
- यदि कोई जानकारी उपलब्ध नहीं है तो उसे छोड़ दें।
- न्यायालय, मामला और वादी का नाम यथावत रखें।
- केवल अंतिम दस्तावेज़ लौटाएँ।

न्यायालय: {court}
वाद: {matter}
वादी: {client}
अधिवक्ता: {advocate}

दिए गए तथ्य:
{facts}

प्रारूप:

वाद पत्र

माननीय न्यायालय के समक्ष

वाद: {matter}

वादी: {client}

प्रतिवादी: (यदि तथ्य में उपलब्ध हो तभी लिखें)

अधिकारिता

दिए गए तथ्यों के आधार पर अधिकारिता का संक्षिप्त उल्लेख करें।

वाद के तथ्य

- केवल दिए गए तथ्यों को क्रमांकित अनुच्छेदों में लिखें।
- कोई नया तथ्य न जोड़ें।

वाद का कारण

केवल उपलब्ध तथ्यों के आधार पर संक्षिप्त कारण लिखें।

प्रार्थना

केवल उपलब्ध तथ्यों के अनुरूप राहत लिखें।

अधिवक्ता

{advocate}
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft a Civil Plaint for an Indian Court.

CRITICAL RULES:
- Use ONLY supplied facts.
- Never invent names, addresses, dates, allegations or statutory provisions.
- Omit missing information.
- Preserve Court, Matter and Client names exactly.
- Return only the final document.

Court: {court}
Matter: {matter}
Plaintiff: {client}
Advocate: {advocate}

SUPPLIED FACTS:
{facts}

Required Structure:

PLAINT

IN THE COURT OF {court}

Matter: {matter}

Plaintiff: {client}

Defendant: (mention only if provided)

Jurisdiction

Briefly state jurisdiction only from supplied facts.

Facts of the Case

- Present only supplied facts as numbered paragraphs.
- Do not add assumptions.

Cause of Action

State it only from supplied facts.

Prayer

Request relief only to the extent supported by supplied facts.

Advocate

{advocate}
""";
    }

    private string BuildWrittenStatementPrompt(
      string client,
      string matter,
      string court,
      string facts,
      string advocate,
      bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: भारतीय न्यायालय के लिए लिखित बयान (Written Statement) तैयार करें।

महत्वपूर्ण नियम:
- केवल दिए गए तथ्यों का उपयोग करें।
- कोई नया बचाव, आरोप, स्वीकारोक्ति या कानूनी तथ्य न जोड़ें।
- यदि जानकारी उपलब्ध नहीं है तो उसे छोड़ दें।
- केवल अंतिम दस्तावेज़ लौटाएँ।

न्यायालय: {court}
वाद: {matter}
प्रतिवादी/पक्षकार: {client}
अधिवक्ता: {advocate}

दिए गए तथ्य:
{facts}

प्रारूप:

लिखित बयान

माननीय न्यायालय के समक्ष

वाद: {matter}

प्रारंभिक आपत्तियाँ

यदि दिए गए तथ्यों में आधार हो तभी लिखें, अन्यथा यह शीर्षक छोड़ दें।

अनुच्छेदवार उत्तर

- केवल दिए गए तथ्यों के आधार पर उत्तर दें।
- तथ्य उपलब्ध न होने पर नया उत्तर न गढ़ें।

अतिरिक्त निवेदन

केवल उपलब्ध तथ्यों के आधार पर।

प्रार्थना

माननीय न्यायालय से उपलब्ध तथ्यों के अनुरूप उचित आदेश पारित करने का निवेदन है।

अधिवक्ता

{advocate}
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft a Written Statement for an Indian Court.

CRITICAL RULES:
- Use ONLY supplied facts.
- Never invent admissions, denials, allegations, legal provisions or procedural history.
- Omit unknown information.
- Return only the final document.

Court: {court}
Matter: {matter}
Party: {client}
Advocate: {advocate}

SUPPLIED FACTS:
{facts}

Required Structure:

WRITTEN STATEMENT

IN THE COURT OF {court}

Matter: {matter}

Preliminary Objections

Include only if supported by supplied facts.

Paragraph-wise Reply

- Respond only using supplied facts.
- Do not fabricate replies.

Additional Submissions

Include only if supported by supplied facts.

Prayer

Seek appropriate relief only to the extent supported by supplied facts.

Advocate

{advocate}
""";
    }

    private string BuildLegalNoticePrompt(
        string client,
        string matter,
        string court,
        string facts,
        string advocate,
        bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: भारतीय विधि के अनुसार कानूनी नोटिस तैयार करें।

नियम:
- प्राप्तकर्ता का नाम उपलब्ध न हो तो खाली छोड़ दें।
- कोई नई मांग न जोड़ें।

मुवक्किल: {client}
विषय: {matter}

तथ्य:
{facts}

प्रारूप

कानूनी नोटिस

प्रति

विषय: {matter}

तथ्य

केवल उपलब्ध तथ्यों का उपयोग करें।

कानूनी स्थिति

उपलब्ध तथ्यों के आधार पर।

मांग

यदि तथ्यों में मांग हो तो लिखें।

अधिवक्ता
{advocate}
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft an Indian Legal Notice.

Client: {client}
Matter: {matter}

Facts:
{facts}

Required structure

LEGAL NOTICE

To

Subject: {matter}

Facts

Use only supplied facts.

Legal Position

Based only on supplied facts.

Demand

Include only demands supported by supplied facts.

Advocate
{advocate}
""";
    }

    private string BuildReplyNoticePrompt(
        string client,
        string matter,
        string court,
        string facts,
        string advocate,
        bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: कानूनी नोटिस का उत्तर तैयार करें।

मुवक्किल: {client}
विषय: {matter}

तथ्य:
{facts}

प्रारूप

उत्तर नोटिस

प्राप्त नोटिस का उत्तर

केवल उपलब्ध तथ्यों पर आधारित उत्तर दें।

निष्कर्ष

अधिवक्ता
{advocate}
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft a Reply to a Legal Notice.

Client: {client}
Matter: {matter}

Facts:
{facts}

Required structure

REPLY NOTICE

Reply

Respond only using supplied facts.

Conclusion

Advocate
{advocate}
""";
    }

    private string BuildBailPrompt(
        string client,
        string matter,
        string court,
        string facts,
        string advocate,
        bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: जमानत आवेदन तैयार करें।

महत्वपूर्ण:
- गिरफ्तारी, हिरासत, एफआईआर या अपराध स्वयं न जोड़ें।
- यदि तथ्य उपलब्ध हों तभी उनका उपयोग करें।

आवेदक: {client}
वाद: {matter}

तथ्य:
{facts}

प्रारूप

जमानत आवेदन

आधार

केवल उपलब्ध तथ्यों के आधार पर।

प्रार्थना

माननीय न्यायालय से जमानत प्रदान करने का निवेदन है।

अधिवक्ता
{advocate}
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft an Indian Bail Application.

Critical:
- Never invent custody, FIR or offence details.
- Use only supplied facts.

Applicant: {client}
Matter: {matter}
Court: {court}

Facts:
{facts}

Required structure

BAIL APPLICATION

Grounds

Only supported by supplied facts.

Prayer

It is respectfully prayed that this Hon'ble Court grant bail if supported by the supplied facts.

Advocate
{advocate}
""";
    }

    private string BuildArgumentsPrompt(
        string client,
        string matter,
        string court,
        string facts,
        string advocate,
        bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: लिखित बहस तैयार करें।

मुवक्किल: {client}
वाद: {matter}

तथ्य:
{facts}

प्रारूप

लिखित बहस

विवादित प्रश्न

प्रस्तुतियाँ

उपलब्ध तथ्यों के आधार पर।

प्रार्थना

अधिवक्ता
{advocate}
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft Written Arguments.

Client: {client}
Matter: {matter}
Court: {court}

Facts:
{facts}

Required structure

WRITTEN ARGUMENTS

Issues

Submissions

Only based on supplied facts.

Prayer

Advocate
{advocate}
""";
    }

    private string BuildGenericPrompt(
        string client,
        string matter,
        string court,
        string facts,
        string advocate,
        bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: भारतीय न्यायालय हेतु पेशेवर कानूनी मसौदा तैयार करें।

मुवक्किल: {client}
वाद: {matter}
न्यायालय: {court}

तथ्य:
{facts}

केवल अंतिम दस्तावेज़ लौटाएँ।
""";
        }

        return $"""
{CommonRules(false)}

Task: Draft a professional Indian legal document.

Client: {client}
Matter: {matter}
Court: {court}

Facts:
{facts}

Return only the final document.
""";
    }

    private string BuildCaseSummaryPrompt(
    string client,
    string matter,
    string court,
    string facts,
    string advocate,
    bool hi)
    {
        if (hi)
        {
            return $"""
{CommonRules(true)}

कार्य: केस सारांश तैयार करें।

मुवक्किल: {client}
वाद: {matter}
न्यायालय: {court}

तथ्य:
{facts}

प्रारूप

केस सारांश

संक्षिप्त विवरण

पक्षकार

मुख्य तथ्य

वर्तमान स्थिति

अगला कदम
""";
        }

        return $"""
{CommonRules(false)}

Task: Generate a Case Summary.

Client: {client}
Matter: {matter}
Court: {court}

Facts:
{facts}

Required structure

CASE SUMMARY

Overview

Parties

Key Facts

Current Stage

Next Action
""";
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