using DraftLex.Application.Features.Copilot;
using DraftLex.Application.Interfaces;
using DraftLex.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

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

        var baseUrl =
            configuration["Ollama:BaseUrl"]
            ?? "http://localhost:11434";

        if (!baseUrl.EndsWith("/"))
            baseUrl += "/";

        _httpClient.BaseAddress = new Uri(baseUrl);

        _httpClient.Timeout = Timeout.InfiniteTimeSpan;

        _modelName =
            configuration["Ollama:Model"]
            ?? "qwen2.5:7b";
    }

    // ============================================================
    // CHAT
    // ============================================================

    public async Task<CopilotChatResponse> ChatAsync(
        Guid matterId,
        string message,
        List<Guid> documentIds,
        CancellationToken cancellationToken = default)
    {
        if (matterId == Guid.Empty)
            throw new ArgumentException(
                "MatterId is required.",
                nameof(matterId));

        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException(
                "Copilot message cannot be empty.",
                nameof(message));

        documentIds ??= [];

        // --------------------------------------------------------
        // MATTER
        // --------------------------------------------------------

        var matter = await _db.Matters
            .Include(x => x.Client)
            .FirstOrDefaultAsync(
                x => x.Id == matterId,
                cancellationToken);

        if (matter == null)
            throw new ArgumentException("Matter not found.");

        // --------------------------------------------------------
        // DOCUMENTS
        // --------------------------------------------------------
        // Use explicitly selected documents when supplied.
        // If none are supplied, or none of the supplied IDs belong
        // to this matter, fall back to all documents for the matter.
        // --------------------------------------------------------

        List<LegalDocument> selectedDocuments;

        if (documentIds.Count > 0)
        {
            selectedDocuments = await _db.LegalDocuments
                .Where(x =>
                    x.MatterId == matterId &&
                    documentIds.Contains(x.Id))
                .OrderBy(x => x.Title)
                .ThenByDescending(x => x.Version)
                .ToListAsync(cancellationToken);
        }
        else
        {
            selectedDocuments = [];
        }

        // For cross-examination, if the user did not explicitly
        // select a document, first locate the requested witness
        // document (for example PW1-Test). This prevents Copilot
        // from depending on the React selection state.
        if (selectedDocuments.Count == 0 &&
            IsCrossExaminationRequest(message))
        {
            var witnessLabel =
                ExtractWitnessLabel(message);

            var witnessNumber =
                Regex.Match(
                    witnessLabel,
                    @"\d+").Value;

            var witnessDocuments =
                await _db.LegalDocuments
                    .Where(x =>
                        x.MatterId == matterId &&
                        (
                            EF.Functions.ILike(
                                x.Title,
                                $"%{witnessLabel}%")
                            ||
                            EF.Functions.ILike(
                                x.Title,
                                $"%PW-{witnessNumber}%")
                            ||
                            EF.Functions.ILike(
                                x.Title,
                                $"%PW {witnessNumber}%")
                            ||
                            EF.Functions.ILike(
                                x.Content,
                                $"%{witnessLabel}%")
                            ||
                            EF.Functions.ILike(
                                x.Content,
                                $"%PW-{witnessNumber}%")
                            ||
                            EF.Functions.ILike(
                                x.Content,
                                $"%PW {witnessNumber}%")
                        ))
                    .OrderByDescending(x => x.Version)
                    .ThenBy(x => x.Title)
                    .ToListAsync(cancellationToken);

            if (witnessDocuments.Count > 0)
            {
                selectedDocuments = witnessDocuments;
            }
        }

        // Final fallback for Copilot requests where no document was
        // explicitly selected and no witness-specific document was
        // found.
        if (selectedDocuments.Count == 0)
        {
            selectedDocuments = await _db.LegalDocuments
                .Where(x => x.MatterId == matterId)
                .OrderBy(x => x.Title)
                .ThenByDescending(x => x.Version)
                .ToListAsync(cancellationToken);
        }

        // --------------------------------------------------------
        // HEARINGS
        // --------------------------------------------------------

        var hearings = await _db.Hearings
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.HearingDate)
            .ToListAsync(cancellationToken);

        // --------------------------------------------------------
        // TIMELINE
        // --------------------------------------------------------

        var timeline = await _db.TimelineEvents
            .Where(x => x.MatterId == matterId)
            .OrderBy(x => x.EventDate)
            .ToListAsync(cancellationToken);

        string reply;

        // ========================================================
        // CROSS EXAMINATION
        // ========================================================

        if (IsCrossExaminationRequest(message))
        {
            reply = await GenerateGroundedCrossExaminationAsync(
                matter,
                selectedDocuments,
                hearings,
                timeline,
                message,
                cancellationToken);
        }
        else
        {
            // ====================================================
            // GENERAL COPILOT
            // ====================================================

            var prompt = BuildGeneralCopilotPrompt(
                matter,
                selectedDocuments,
                hearings,
                timeline,
                message);

            reply = await GenerateAsync(
                prompt,
                cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(reply))
            reply = "No response received from Copilot.";

        // ========================================================
        // SAVE CHAT HISTORY
        // ========================================================

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

    // ============================================================
    // HISTORY
    // ============================================================

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
    // CROSS EXAMINATION
    // ============================================================

    private async Task<string> GenerateGroundedCrossExaminationAsync(
        Matter matter,
        List<LegalDocument> documents,
        List<Hearing> hearings,
        List<TimelineEvent> timeline,
        string lawyerRequest,
        CancellationToken cancellationToken)
    {
        // --------------------------------------------------------
        // Extract testimony from selected documents.
        // --------------------------------------------------------

        var testimonyBlocks =
            new List<string>();

        foreach (var document in documents)
        {
            // First try to isolate/clean the witness testimony.
            var testimony =
                ExtractWitnessTestimony(document.Content);

            // If the structured extractor cannot identify a witness
            // section, NEVER discard a non-empty source document.
            // Use its raw content after removing only obvious
            // document metadata. The source document remains the
            // factual source of truth.
            if (string.IsNullOrWhiteSpace(testimony) &&
                !string.IsNullOrWhiteSpace(document.Content))
            {
                testimony =
                    CleanRawDocumentContent(document.Content);
            }

            if (!string.IsNullOrWhiteSpace(testimony))
            {
                testimonyBlocks.Add(testimony);
            }
        }

        var fullTestimony =
            string.Join(
                Environment.NewLine + Environment.NewLine,
                testimonyBlocks);

        if (string.IsNullOrWhiteSpace(fullTestimony))
        {
            var documentSummary =
                documents.Count == 0
                    ? "No LegalDocument records were loaded for this matter."
                    : string.Join(
                        Environment.NewLine,
                        documents.Select(d =>
                            $"{d.Title} | {d.DocumentType} | " +
                            $"Version {d.Version} | " +
                            $"ContentLength={d.Content?.Length ?? 0}"));

            return
                "CROSS-EXAMINATION OF " +
                ExtractWitnessLabel(lawyerRequest) +
                Environment.NewLine +
                Environment.NewLine +
                "No witness testimony text could be extracted." +
                Environment.NewLine +
                Environment.NewLine +
                "Documents loaded by Copilot:" +
                Environment.NewLine +
                documentSummary;
        }

        // --------------------------------------------------------
        // ONE LLM CALL
        //
        // IMPORTANT:
        // Qwen does NOT directly produce the final response.
        //
        // It produces candidate questions WITH the exact source
        // statement supporting each question.
        // --------------------------------------------------------

        var prompt =
            BuildGroundedCrossExaminationPrompt(
                fullTestimony,
                matter,
                hearings,
                timeline,
                lawyerRequest);

        string rawResponse;

        try
        {
            rawResponse =
                await GenerateAsync(
                    prompt,
                    cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw new TimeoutException(
                "DraftLex Copilot timed out while waiting for Ollama.");
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException(
                "DraftLex could not connect to Ollama at " +
                $"{_httpClient.BaseAddress}. " +
                $"Make sure {_modelName} is running.",
                ex);
        }

        // --------------------------------------------------------
        // DETERMINISTIC VALIDATION
        // --------------------------------------------------------

        var candidates =
            ParseCrossExaminationCandidates(
                rawResponse);

        var validatedQuestions =
            ValidateAndBuildQuestions(
                candidates,
                fullTestimony);

        // --------------------------------------------------------
        // DETERMINISTIC SOURCE COVERAGE
        //
        // Qwen is allowed to improve phrasing, but it must NOT
        // decide how many source-supported questions are returned.
        // Build a deterministic question for every usable testimony
        // statement and use that complete set whenever Qwen returns
        // fewer questions. This prevents the model from returning
        // only one or two questions from a seven-statement testimony.
        // --------------------------------------------------------

        var sourceQuestions =
            BuildFallbackQuestions(
                fullTestimony);

        // The source-derived questions are authoritative. Qwen may
        // return fewer questions or awkward transformations. For legal
        // grounding, never allow that to remove a supported source fact.
        // Use the deterministic source set as the final baseline.
        if (sourceQuestions.Count > 0)
        {
            validatedQuestions = MergeSourceGroundedQuestions(
                sourceQuestions,
                validatedQuestions);
        }
        else
        {
            validatedQuestions = sourceQuestions;
        }

        // --------------------------------------------------------
        // FINAL OUTPUT
        // --------------------------------------------------------

        var witnessLabel =
            ExtractWitnessLabel(
                lawyerRequest);

        var output =
            new StringBuilder();

        output.AppendLine(
            $"CROSS-EXAMINATION OF {witnessLabel}");

        output.AppendLine();

        for (var i = 0;
             i < validatedQuestions.Count;
             i++)
        {
            output.AppendLine(
                $"{i + 1}. {validatedQuestions[i]}");
        }

        return output
            .ToString()
            .Trim();
    }

    // ============================================================
    // CROSS EXAMINATION PROMPT
    // ============================================================

    private static string BuildGroundedCrossExaminationPrompt(
        string testimony,
        Matter matter,
        List<Hearing> hearings,
        List<TimelineEvent> timeline,
        string lawyerRequest)
    {
        var sb =
            new StringBuilder();

        sb.AppendLine(
            "You are a legal cross-examination drafting assistant.");

        sb.AppendLine();

        sb.AppendLine(
            "Your output will be mechanically validated by software.");

        sb.AppendLine(
            "You MUST NOT invent facts.");

        sb.AppendLine();

        // --------------------------------------------------------
        // CRITICAL RULE
        // --------------------------------------------------------

        sb.AppendLine(
            "===== CRITICAL SOURCE RULE =====");

        sb.AppendLine(
            "Every candidate question MUST be supported by the exact " +
            "source statement supplied with that candidate.");

        sb.AppendLine(
            "The source field MUST contain an exact sentence or exact " +
            "contiguous passage copied from the witness testimony.");

        sb.AppendLine(
            "Do not paraphrase the source field.");

        sb.AppendLine(
            "Do not create a source field that does not exist in the testimony.");

        sb.AppendLine(
            "The testimony below is the source text stored in DraftLex. " +
            "It may have been cleaned from a witness section or recovered " +
            "directly from the stored document content.");

        sb.AppendLine(
            "Do NOT reproduce document headings, paragraph numbers, " +
            "question numbers, or source labels in any question.");

        sb.AppendLine(
            "The number of a source statement is NOT a fact and must " +
            "never appear in a generated question.");

        sb.AppendLine();

        // --------------------------------------------------------
        // QUESTION RULE
        // --------------------------------------------------------

        sb.AppendLine(
            "===== QUESTION RULE =====");

        sb.AppendLine(
            "Generate concise leading cross-examination questions.");

        sb.AppendLine(
            "Do not simply invent new factual premises.");

        sb.AppendLine(
            "Do not ask about facts that are absent from the testimony.");

        sb.AppendLine(
            "Do not ask about distance unless distance appears in the testimony.");

        sb.AppendLine(
            "Do not ask about visibility unless visibility appears in the testimony.");

        sb.AppendLine(
            "Do not ask about other persons unless other persons appear in the testimony.");

        sb.AppendLine(
            "Do not ask about prior interactions unless prior interactions appear.");

        sb.AppendLine(
            "Do not ask about motive unless motive appears.");

        sb.AppendLine(
            "Do not ask about suspicious conduct unless suspicious conduct appears.");

        sb.AppendLine(
            "Do not ask about characteristics of an object unless those characteristics appear.");

        sb.AppendLine();

        // --------------------------------------------------------
        // SUBJECT
        // --------------------------------------------------------

        sb.AppendLine(
            "===== SUBJECT PRESERVATION =====");

        sb.AppendLine(
            "Preserve exactly who performed each action.");

        sb.AppendLine(
            "Never transfer an action from the accused to the witness.");

        sb.AppendLine(
            "Never transfer an action from the witness to the accused.");

        sb.AppendLine();

        // --------------------------------------------------------
        // DATE/TIME
        // --------------------------------------------------------

        sb.AppendLine(
            "===== DATE AND TIME =====");

        sb.AppendLine(
            "Preserve dates exactly.");

        sb.AppendLine(
            "Preserve times exactly.");

        sb.AppendLine(
            "Preserve qualifiers such as approximately.");

        sb.AppendLine(
            "Never turn an approximate time into an exact time.");

        sb.AppendLine();

        // --------------------------------------------------------
        // CAUSAL RELATIONSHIP
        // --------------------------------------------------------

        sb.AppendLine(
            "===== CAUSAL RELATIONSHIPS =====");

        sb.AppendLine(
            "A causal relationship may be used only when it is explicitly " +
            "contained in the source statement.");

        sb.AppendLine(
            "Do not invent why an event happened.");

        sb.AppendLine(
            "Do not invent why the witness identified someone.");

        sb.AppendLine(
            "Do not connect two separate facts unless the source explicitly connects them.");

        sb.AppendLine();

        // --------------------------------------------------------
        // QUESTION QUALITY
        // --------------------------------------------------------

        sb.AppendLine(
            "===== QUALITY =====");

        sb.AppendLine(
            "Use the testimony as a whole.");

        sb.AppendLine(
            "Avoid meaningless repetition.");

        sb.AppendLine(
            "Do not create questions merely to increase question count.");

        sb.AppendLine(
            "Only return questions that are genuinely supported.");

        sb.AppendLine();

        // --------------------------------------------------------
        // SOURCE TESTIMONY
        // --------------------------------------------------------

        sb.AppendLine(
            "===== WITNESS TESTIMONY =====");

        sb.AppendLine(
            testimony);

        sb.AppendLine();

        // --------------------------------------------------------
        // LAWYER REQUEST
        // --------------------------------------------------------

        sb.AppendLine(
            "===== LAWYER REQUEST =====");

        sb.AppendLine(
            lawyerRequest);

        sb.AppendLine();

        // --------------------------------------------------------
        // JSON FORMAT
        // --------------------------------------------------------

        sb.AppendLine(
            "===== REQUIRED OUTPUT =====");

        sb.AppendLine(
            "Return ONLY valid JSON.");

        sb.AppendLine(
            "Do not use markdown.");

        sb.AppendLine(
            "Do not use a code fence.");

        sb.AppendLine();

        sb.AppendLine(
            "The JSON must be an array of objects:");

        sb.AppendLine();

        sb.AppendLine(
            "[");

        sb.AppendLine(
            "  {");

        sb.AppendLine(
            "    \"source\": \"EXACT SOURCE SENTENCE\", ");

        sb.AppendLine(
            "    \"question\": \"CROSS-EXAMINATION QUESTION\"");

        sb.AppendLine(
            "  }");

        sb.AppendLine(
            "]");

        sb.AppendLine();

        sb.AppendLine(
            "The source value MUST be copied exactly from the testimony.");

        sb.AppendLine(
            "The question must not introduce factual words or concepts " +
            "that are unsupported by the source.");

        sb.AppendLine(
            "If the testimony does not support a useful additional question, " +
            "do not invent one.");

        return sb.ToString();
    }

    // ============================================================
    // PARSE CANDIDATES
    // ============================================================

    private static List<CrossQuestionCandidate>
        ParseCrossExaminationCandidates(
            string response)
    {
        var result =
            new List<CrossQuestionCandidate>();

        if (string.IsNullOrWhiteSpace(response))
            return result;

        var json =
            ExtractJsonArray(response);

        if (string.IsNullOrWhiteSpace(json))
            return result;

        try
        {
            var options =
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

            var candidates =
                JsonSerializer.Deserialize<
                    List<CrossQuestionCandidate>>(
                    json,
                    options);

            if (candidates != null)
                result.AddRange(candidates);
        }
        catch (JsonException)
        {
            // Invalid model output is rejected.
            // Deterministic fallback will handle it.
        }

        return result;
    }

    // ============================================================
    // EXTRACT JSON ARRAY
    // ============================================================

    private static string ExtractJsonArray(
        string response)
    {
        var text =
            response.Trim();

        // Remove markdown code fences if Qwen ignored instructions.
        if (text.StartsWith("```"))
        {
            var firstNewLine =
                text.IndexOf('\n');

            if (firstNewLine >= 0)
                text =
                    text[(firstNewLine + 1)..];

            if (text.EndsWith("```"))
                text =
                    text[..^3];

            text =
                text.Trim();
        }

        var start =
            text.IndexOf('[');

        var end =
            text.LastIndexOf(']');

        if (start < 0 ||
            end <= start)
        {
            return string.Empty;
        }

        return text[
            start..(end + 1)];
    }

    // ============================================================
    // VALIDATE QUESTIONS
    // ============================================================

    private static List<string>
        ValidateAndBuildQuestions(
            List<CrossQuestionCandidate> candidates,
            string testimony)
    {
        var valid =
            new List<string>();

        foreach (var candidate in candidates)
        {
            if (candidate == null)
                continue;

            var source =
                NormalizeText(
                    candidate.Source);

            var question =
                NormalizeQuestion(
                    candidate.Question);

            if (string.IsNullOrWhiteSpace(source) ||
                string.IsNullOrWhiteSpace(question))
            {
                continue;
            }

            // ----------------------------------------------------
            // SOURCE MUST EXIST EXACTLY IN TESTIMONY
            // ----------------------------------------------------

            if (!ContainsNormalizedText(
                    testimony,
                    source))
            {
                continue;
            }

            // ----------------------------------------------------
            // QUESTION MUST BE A QUESTION
            // ----------------------------------------------------

            if (!question.EndsWith("?"))
            {
                question += "?";
            }

            // ----------------------------------------------------
            // REJECT SOURCE/DOCUMENT METADATA
            // ----------------------------------------------------

            if (ContainsSourceMetadata(question))
                continue;

            // ----------------------------------------------------
            // QUESTION MUST NOT CONTAIN UNSUPPORTED CONTENT
            // ----------------------------------------------------

            if (!QuestionUsesOnlySupportedWords(
                    question,
                    source))
            {
                continue;
            }

            // ----------------------------------------------------
            // REJECT KNOWN UNSUPPORTED PATTERNS
            // ----------------------------------------------------

            if (ContainsUnsupportedPattern(
                    question))
            {
                continue;
            }

            // ----------------------------------------------------
            // REJECT DUPLICATES
            // ----------------------------------------------------

            var duplicate =
                valid.Any(x =>
                    string.Equals(
                        NormalizeText(x),
                        NormalizeText(question),
                        StringComparison.OrdinalIgnoreCase));

            if (duplicate)
                continue;

            valid.Add(question);
        }

        return valid;
    }

    // ============================================================
    // SOURCE METADATA VALIDATION
    // ============================================================

    private static bool
        ContainsSourceMetadata(
            string question)
    {
        if (string.IsNullOrWhiteSpace(question))
            return true;

        var text =
            question
                .Trim()
                .ToLowerInvariant();

        string[] metadataPatterns =
        [
            "examination-in-chief",
            "examination in chief",
            "cross-examination",
            "cross examination",
            "chief examination",
            "witness testimony",
            "pw1 examination",
            "pw2 examination",
            "pw3 examination",
            "pw4 examination",
            "pw5 examination"
        ];

        if (metadataPatterns.Any(text.Contains))
            return true;

        // DraftLex adds final question numbering itself.
        // Never allow a model-generated source number through.
        if (Regex.IsMatch(
                question.Trim(),
                @"^\d+[\.\)]"))
        {
            return true;
        }

        return false;
    }

    // ============================================================
    // QUESTION WORD VALIDATION
    // ============================================================

    private static bool QuestionUsesOnlySupportedWords(
        string question,
        string source)
    {
        var sourceWords =
            Tokenize(source);

        var questionWords =
            Tokenize(question);

        // Words that are allowed because they are grammatical
        // transformations required to turn testimony into a question.
        var allowed =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "did",
                "do",
                "does",
                "you",
                "your",
                "were",
                "was",
                "are",
                "is",
                "have",
                "has",
                "had",
                "can",
                "could",
                "would",
                "will",
                "may",
                "might",
                "shall",
                "should",
                "the",
                "a",
                "an",
                "and",
                "or",
                "of",
                "to",
                "in",
                "on",
                "at",
                "for",
                "from",
                "with",
                "by",
                "as",
                "that",
                "this",
                "these",
                "those",
                "it",
                "they",
                "them",
                "their",
                "there",
                "then",
                "when",
                "where",
                "who",
                "what",
                "which",
                "how",
                "why",
                "whether",
                "correct",
                "right"
            };

        foreach (var word in questionWords)
        {
            if (allowed.Contains(word))
                continue;

            if (sourceWords.Contains(word))
                continue;

            // ----------------------------------------------------
            // Small grammatical transformations.
            // ----------------------------------------------------

            if (IsAllowedMorphologicalVariant(
                    word,
                    sourceWords))
            {
                continue;
            }

            return false;
        }

        return true;
    }

    // ============================================================
    // MORPHOLOGICAL VARIANTS
    // ============================================================

    private static bool IsAllowedMorphologicalVariant(
        string word,
        HashSet<string> sourceWords)
    {
        if (word.Length < 5)
            return false;

        // carrying -> carry
        if (word.EndsWith("ing"))
        {
            var root =
                word[..^3];

            if (sourceWords.Contains(root))
                return true;

            if (sourceWords.Contains(
                    root + "y"))
            {
                return true;
            }
        }

        // identified -> identify
        if (word.EndsWith("ed"))
        {
            var root =
                word[..^2];

            if (sourceWords.Contains(root))
                return true;
        }

        // identified -> identification
        if (word.EndsWith("tion"))
        {
            var root =
                word[..^4];

            if (sourceWords.Contains(root))
                return true;
        }

        return false;
    }

    // ============================================================
    // UNSUPPORTED PATTERNS
    // ============================================================

    private static bool ContainsUnsupportedPattern(
        string question)
    {
        var text =
            question.ToLowerInvariant();

        string[] dangerousPatterns =
        [
            "any other",
            "other individuals",
            "prior interaction",
            "prior interactions",
            "previous interaction",
            "previous interactions",
            "any specific characteristics",
            "specific characteristics",
            "suspicious",
            "out of the ordinary",
            "how far",
            "what distance",
            "distance from",
            "visible to you",
            "visibility",
            "obstruction",
            "obstructions",
            "no obstruction",
            "without obstruction",
            "other person",
            "other persons",
            "another person",
            "another individual",
            "anyone else",
            "someone else",
            "before this incident",
            "before the incident"
        ];

        return dangerousPatterns.Any(
            text.Contains);
    }

    // ============================================================
    // FALLBACK
    //
    // This does NOT invent facts.
    //
    // It converts the witness's own statements into confirmation
    // questions.
    // ============================================================

    private static List<string>
        BuildFallbackQuestions(
            string testimony)
    {
        var result =
            new List<string>();

        var statements =
            SplitIntoStatements(
                testimony);

        foreach (var statement in statements)
        {
            var question =
                ConvertStatementToQuestion(
                    statement);

            if (string.IsNullOrWhiteSpace(question))
                continue;

            if (!result.Any(x =>
                    string.Equals(
                        NormalizeText(x),
                        NormalizeText(question),
                        StringComparison.OrdinalIgnoreCase)))
            {
                result.Add(question);
            }
        }

        return result;
    }

    private static List<string>
        MergeSourceGroundedQuestions(
            List<string> sourceQuestions,
            List<string> modelQuestions)
    {
        // Source-derived questions come first because they preserve every
        // usable testimony statement. Model questions are only retained
        // when they are genuinely different and already passed validation.
        var result = new List<string>();

        foreach (var question in sourceQuestions)
        {
            var normalized = NormalizeQuestionSpacing(question);

            if (string.IsNullOrWhiteSpace(normalized))
                continue;

            if (!result.Any(x => string.Equals(
                    NormalizeText(x),
                    NormalizeText(normalized),
                    StringComparison.OrdinalIgnoreCase)))
            {
                result.Add(normalized);
            }
        }

        // Do not append model-only questions. The source question set is
        // intentionally authoritative so Qwen cannot introduce a new fact
        // or alter the coverage/order of the witness testimony.
        return result;
    }

    // ============================================================
    // SPLIT TESTIMONY
    // ============================================================

    private static List<string>
        SplitIntoStatements(
            string testimony)
    {
        var result =
            new List<string>();

        if (string.IsNullOrWhiteSpace(testimony))
            return result;

        var normalized =
            NormalizeWitnessStatementBoundaries(testimony);

        var lines =
            normalized
                .Replace("\r\n", "\n")
                .Replace('\r', '\n')
                .Split(
                    '\n',
                    StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines)
        {
            var text = line.Trim();

            if (string.IsNullOrWhiteSpace(text))
                continue;

            if (IsTestimonyHeading(text))
                continue;

            text = RemoveLeadingNumber(text);

            if (string.IsNullOrWhiteSpace(text))
                continue;

            var sentences = Regex.Split(
                text,
                @"(?<=[.!?])\s+");

            foreach (var sentence in sentences)
            {
                var cleaned = sentence.Trim();

                if (string.IsNullOrWhiteSpace(cleaned))
                    continue;

                if (IsTestimonyHeading(cleaned))
                    continue;

                result.Add(cleaned);
            }
        }

        return result;
    }

    private static string
        NormalizeWitnessStatementBoundaries(
            string testimony)
    {
        var text = testimony
            .Replace("\r\n", "\n")
            .Replace('\r', '\n');

        // Remove headings even when the editor concatenated the heading
        // with the first numbered paragraph.
        text = Regex.Replace(
            text,
            @"PW\s*\d+\s+Examination[- ]?in[- ]?Chief",
            "",
            RegexOptions.IgnoreCase);

        text = Regex.Replace(
            text,
            @"PW\s*\d+\s+(?:Testimony|Evidence)",
            "",
            RegexOptions.IgnoreCase);

        // Restore paragraph boundaries when content was stored as one
        // rich-text node, e.g. "1. I am...2. On...3. I was...".
        text = Regex.Replace(
            text,
            @"\s*(?=\d+[\.)]\s*)",
            "\n");

        return text;
    }

    // ============================================================
    // WITNESS PERSPECTIVE TRANSFORMATION
    // ============================================================

    private static string TransformWitnessPerspective(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var result = Regex.Replace(text, @"\bmy\b", "your", RegexOptions.IgnoreCase);
        result = Regex.Replace(result, @"\bmine\b", "yours", RegexOptions.IgnoreCase);
        result = Regex.Replace(result, @"\bmyself\b", "yourself", RegexOptions.IgnoreCase);

        return NormalizeQuestionSpacing(result);
    }

    // ============================================================
    // STATEMENT -> QUESTION
    // ============================================================

    private static string
        ConvertStatementToQuestion(
            string statement)
    {
        var text =
            statement.Trim();

        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        text =
            text.TrimEnd(
                '.',
                '?',
                '!');

        // --------------------------------------------------------
        // Repair common rich-text concatenations before conversion.
        // --------------------------------------------------------

        text = NormalizeQuestionSpacing(text);

        // A source sentence can legitimately begin with the date/time
        // and then continue with a first-person statement, for example:
        // "On 15 September 2026, at approximately 8:00 PM, I was present..."
        // Convert that into a witness confirmation question rather than
        // producing the malformed "On ..., I was ..." question.
        var datedWasMatch = Regex.Match(
            text,
            @"^(On\s+.+?,\s*)I\s+was\s+(.+)$",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);

        if (datedWasMatch.Success)
        {
            var datePart = datedWasMatch.Groups[1].Value.Trim();

            if (datePart.EndsWith(","))
                datePart = datePart[..^1].Trim();

            var activity = TransformWitnessPerspective(
                datedWasMatch.Groups[2].Value.Trim());

            return
                "You were " +
                activity +
                " on " +
                datePart[3..].Trim() +
                ", correct?";
        }

        // --------------------------------------------------------
        // Witness first-person statements.
        // --------------------------------------------------------

        if (StartsWithIgnoreCase(
                text,
                "I am "))
        {
            return
                "You are " +
                TransformWitnessPerspective(text[5..].Trim()) +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
                text,
                "I was "))
        {
            return
                "You were " +
                TransformWitnessPerspective(text[6..].Trim()) +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
                text,
                "I saw "))
        {
            return
                "You saw " +
                TransformWitnessPerspective(text[6..].Trim()) +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
                text,
                "I identified "))
        {
            return
                "You identified " +
                TransformWitnessPerspective(text[13..].Trim()) +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
                text,
                "I informed "))
        {
            return
                "You informed " +
                TransformWitnessPerspective(text[11..].Trim()) +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
                text,
                "I "))
        {
            return
                "You " +
                TransformWitnessPerspective(text[2..].Trim()) +
                ", correct?";
        }

        // --------------------------------------------------------
        // Third-person / neutral statements.
        // --------------------------------------------------------

        if (StartsWithIgnoreCase(
            text,
            "The accused "))
        {
            return
                text +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
            text,
            "On "))
        {
            return
                text +
                ", correct?";
        }

        if (StartsWithIgnoreCase(
            text,
            "At "))
        {
            return
                text +
                ", correct?";
        }

        return
            text +
            ", correct?";
    }

    // ============================================================
    // TEXT NORMALIZATION
    // ============================================================

    private static string NormalizeText(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return Regex.Replace(
                value
                    .ToLowerInvariant()
                    .Trim(),
                @"\s+",
                " ")
            .Trim();
    }

    private static string NormalizeQuestion(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var text =
            value.Trim();

        text =
            Regex.Replace(
                text,
                @"^(?:\s*\d+[\.\)]\s*)+",
                "");

        text =
            text.Trim(
                '"',
                '\'',
                '`',
                ' ');

        return text;
    }

    // ============================================================
    // NORMALIZED SOURCE CONTAINS
    // ============================================================

    private static bool ContainsNormalizedText(
        string source,
        string candidate)
    {
        var normalizedSource =
            NormalizeText(source);

        var normalizedCandidate =
            NormalizeText(candidate);

        return normalizedSource.Contains(
            normalizedCandidate,
            StringComparison.OrdinalIgnoreCase);
    }

    // ============================================================
    // TOKENIZE
    // ============================================================

    private static HashSet<string>
        Tokenize(string text)
    {
        var matches =
            Regex.Matches(
                text.ToLowerInvariant(),
                @"[\p{L}\p{Nd}]+");

        return matches
            .Select(x => x.Value)
            .ToHashSet(
                StringComparer.OrdinalIgnoreCase);
    }

    // ============================================================
    // WITNESS LABEL
    // ============================================================

    private static string
        ExtractWitnessLabel(
            string lawyerRequest)
    {
        if (string.IsNullOrWhiteSpace(
                lawyerRequest))
        {
            return "PW1";
        }

        var match =
            Regex.Match(
                lawyerRequest,
                @"\bPW[\s\-]?\d+\b",
                RegexOptions.IgnoreCase);

        if (!match.Success)
            return "PW1";

        return
            Regex.Replace(
                    match.Value,
                    @"\s+",
                    "")
                .ToUpperInvariant();
    }

    // ============================================================
    // CROSS EXAMINATION DETECTION
    // ============================================================

    private static bool
        IsCrossExaminationRequest(
            string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        var text =
            message
                .Trim()
                .ToLowerInvariant();

        string[] indicators =
        [
            "cross examination",
            "cross-examination",
            "cross examination questions",
            "cross-examination questions",
            "cross questions",
            "prepare cross",
            "prepare cross examination",
            "prepare cross-examination",
            "generate cross",
            "generate cross examination",
            "generate cross-examination",
            "draft cross",
            "draft cross examination",
            "draft cross-examination",
            "questions for cross",
            "cross of pw",
            "cross examine",
            "cross-examine"
        ];

        return indicators.Any(
            text.Contains);
    }

    // ============================================================
    // WITNESS TESTIMONY EXTRACTION
    // ============================================================

    private static string
        ExtractWitnessTestimony(
            string? content)
    {
        var normalizedContent = NormalizeStoredDocumentContent(content);

        if (string.IsNullOrWhiteSpace(normalizedContent))
            return string.Empty;

        // First try the normal line-based witness extraction.
        var extracted = ExtractWitnessLines(normalizedContent);

        if (!string.IsNullOrWhiteSpace(extracted))
            return extracted;

        // Important: a LegalDocument may contain editor/HTML/JSON text
        // rather than plain newline-delimited text. In that situation,
        // return the normalized source rather than incorrectly reporting
        // that the document has no testimony.
        return NormalizePlainText(normalizedContent);
    }

    // ============================================================
    // ROBUST STORED DOCUMENT NORMALIZATION
    // ============================================================

    private static string
        NormalizeStoredDocumentContent(
            string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;

        var value = content.Trim();

        // Handle JSON-string encoded content such as "PW1...\\n1. I..."
        // without requiring the database to be changed.
        if ((value.StartsWith("\"") && value.EndsWith("\"")) ||
            value.StartsWith("{") ||
            value.StartsWith("["))
        {
            try
            {
                using var json = JsonDocument.Parse(value);

                var extracted = ExtractTextFromJson(json.RootElement);

                if (!string.IsNullOrWhiteSpace(extracted))
                    value = extracted;
            }
            catch (JsonException)
            {
                // Not JSON; continue with the original content.
            }
        }

        // Handle literal escaped newlines that may have been stored by
        // a JSON/editor layer.
        value = value
            .Replace("\\r\\n", "\n", StringComparison.Ordinal)
            .Replace("\\n", "\n", StringComparison.Ordinal)
            .Replace("\\r", "\n", StringComparison.Ordinal)
            .Replace("\\t", "\t", StringComparison.Ordinal);

        // Handle HTML content from a rich-text editor.
        if (Regex.IsMatch(value, @"<\/?[a-zA-Z][^>]*>"))
        {
            value = Regex.Replace(
                value,
                @"<br\s*/?>",
                "\n",
                RegexOptions.IgnoreCase);

            value = Regex.Replace(
                value,
                @"</(p|div|li|h[1-6])>",
                "\n",
                RegexOptions.IgnoreCase);

            value = Regex.Replace(
                value,
                @"<[^>]+>",
                " ");

            value = System.Net.WebUtility.HtmlDecode(value);
        }

        return NormalizePlainText(value);
    }

    private static string
        ExtractTextFromJson(
            JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
            return element.GetString() ?? string.Empty;

        if (element.ValueKind == JsonValueKind.Array)
        {
            var parts = new List<string>();

            foreach (var item in element.EnumerateArray())
            {
                var text = ExtractTextFromJson(item);

                if (!string.IsNullOrWhiteSpace(text))
                    parts.Add(text);
            }

            return string.Join("\n", parts);
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            // Prefer common document/editor content properties.
            string[] preferredProperties =
            [
                "content",
                "text",
                "plainText",
                "plaintext",
                "html",
                "body",
                "value"
            ];

            foreach (var propertyName in preferredProperties)
            {
                if (element.TryGetProperty(
                        propertyName,
                        out var property))
                {
                    var text = ExtractTextFromJson(property);

                    if (!string.IsNullOrWhiteSpace(text))
                        return text;
                }
            }

            var parts = new List<string>();

            foreach (var property in element.EnumerateObject())
            {
                var text = ExtractTextFromJson(property.Value);

                if (!string.IsNullOrWhiteSpace(text))
                    parts.Add(text);
            }

            return string.Join("\n", parts);
        }

        return string.Empty;
    }

    private static string
        NormalizePlainText(
            string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;

        content = content
            .Replace("\r\n", "\n")
            .Replace('\r', '\n');

        var lines = content
            .Split('\n')
            .Select(x => Regex.Replace(x.Trim(), @"[ \t]+", " "))
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(NormalizeQuestionSpacing);

        return string.Join(
            Environment.NewLine,
            lines);
    }

    private static string
        NormalizeQuestionSpacing(
            string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var value = text.Trim();

        // Restore spaces that can disappear when rich-text/HTML nodes are
        // flattened into plain text. These are formatting repairs only; no
        // new factual content is introduced.
        value = Regex.Replace(
            value,
            @"\b(PM|AM),(?=[A-Za-z])",
            "$1, ",
            RegexOptions.IgnoreCase);

        value = Regex.Replace(
            value,
            @"\bsufficientlighting\b",
            "sufficient lighting",
            RegexOptions.IgnoreCase);

        value = Regex.Replace(
            value,
            @"\blightingat\b",
            "lighting at",
            RegexOptions.IgnoreCase);

        value = Regex.Replace(
            value,
            @"\bthelocation\b",
            "the location",
            RegexOptions.IgnoreCase);

        value = Regex.Replace(
            value,
            @"\s+,",
            ",",
            RegexOptions.None);

        value = Regex.Replace(
            value,
            @",(?=\S)",
            ", ");

        value = Regex.Replace(
            value,
            @"\s{2,}",
            " ");

        return value.Trim();
    }

    private static string
        ExtractWitnessLines(
            string content)
    {
        content = NormalizeWitnessStatementBoundaries(content);

        var lines = content.Split(
            '\n',
            StringSplitOptions.None);

        var testimonyLines = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();

            if (string.IsNullOrWhiteSpace(line))
                continue;

            if (IsTestimonyHeading(line))
                continue;

            var originalLine = line;

            if (IsQuestionLine(originalLine))
                continue;

            line = RemoveLeadingNumber(line);

            if (string.IsNullOrWhiteSpace(line))
                continue;

            if (IsAnswerLine(line))
                line = RemoveAnswerMarker(line);

            if (string.IsNullOrWhiteSpace(line))
                continue;

            testimonyLines.Add(line.Trim());
        }

        return string.Join(
            Environment.NewLine,
            testimonyLines);
    }

    // ============================================================
    // RAW DOCUMENT FALLBACK
    // ============================================================

    private static string
        CleanRawDocumentContent(
            string content)
    {
        // Do NOT use the old aggressive cleaner here. The old behavior
        // could remove all usable source text from a rich-text/encoded
        // LegalDocument and then incorrectly report no testimony.
        return NormalizeStoredDocumentContent(content);
    }

    private static string
        RemoveLeadingNumber(
            string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return string.Empty;

        return Regex.Replace(
            line.Trim(),
            @"^\s*\d+[\.\)]\s*",
            "");
    }

    private static bool
        IsTestimonyHeading(
            string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            return false;

        var normalized =
            Regex.Replace(
                line.Trim(),
                @"[\s\-]+",
                " ")
            .ToLowerInvariant()
            .Trim();

        if (Regex.IsMatch(
                normalized,
                @"^pw\s*\d+\s+(examination|testimony|evidence)(\s+in\s+chief)?$"))
        {
            return true;
        }

        string[] headings =
        [
            "examination in chief",
            "cross examination",
            "chief examination",
            "witness testimony",
            "testimony of pw",
            "evidence of pw"
        ];

        return headings.Any(
            x => normalized.Equals(
                x,
                StringComparison.OrdinalIgnoreCase));
    }

    // ============================================================
    // QUESTION LINE
    // ============================================================

    private static bool
        IsQuestionLine(
            string line)
    {
        var normalized =
            line.Trim();

        if (string.IsNullOrWhiteSpace(
                normalized))
        {
            return false;
        }

        var lower =
            normalized.ToLowerInvariant();

        string[] explicitMarkers =
        [
            "q:",
            "q.",
            "question:",
            "examiner:",
            "counsel:",
            "lawyer:",
            "advocate:"
        ];

        if (explicitMarkers.Any(
                lower.StartsWith))
        {
            return true;
        }

        // Handle numbered questions BEFORE the number is removed.
        // Example: "1. Where were you standing?"
        if (Regex.IsMatch(
                normalized,
                @"^\d+[\.\)]\s+.*\?$"))
        {
            return true;
        }

        // Also recognise a plain question line.
        return normalized.EndsWith(
            "?",
            StringComparison.Ordinal);
    }

    // ============================================================
    // ANSWER LINE
    // ============================================================

    private static bool
        IsAnswerLine(
            string line)
    {
        var normalized =
            line.Trim();

        if (string.IsNullOrWhiteSpace(
                normalized))
        {
            return false;
        }

        var lower =
            normalized.ToLowerInvariant();

        string[] markers =
        [
            "a:",
            "a.",
            "answer:",
            "witness:",
            "pw1:",
            "pw-1:",
            "pw 1:"
        ];

        return markers.Any(
            lower.StartsWith);
    }

    // ============================================================
    // REMOVE ANSWER MARKER
    // ============================================================

    private static string
        RemoveAnswerMarker(
            string line)
    {
        var normalized =
            line.Trim();

        string[] markers =
        [
            "A:",
            "A.",
            "Answer:",
            "Witness:",
            "PW1:",
            "PW-1:",
            "PW 1:"
        ];

        foreach (var marker in markers)
        {
            if (normalized.StartsWith(
                    marker,
                    StringComparison.OrdinalIgnoreCase))
            {
                return normalized[
                    marker.Length..]
                    .Trim();
            }
        }

        return normalized;
    }

    // ============================================================
    // GENERAL COPILOT PROMPT
    // ============================================================

    private static string
        BuildGeneralCopilotPrompt(
            Matter matter,
            List<LegalDocument> documents,
            List<Hearing> hearings,
            List<TimelineEvent> timeline,
            string lawyerRequest)
    {
        var sb =
            new StringBuilder();

        sb.AppendLine(
            "You are a legal drafting assistant inside DraftLex.");

        sb.AppendLine(
            "Answer the lawyer's request using the supplied matter " +
            "context and selected documents.");

        sb.AppendLine(
            "Do not invent case facts.");

        sb.AppendLine();

        sb.AppendLine(
            "===== MATTER =====");

        sb.AppendLine(
            $"Matter Number: " +
            $"{matter.MatterNumber ?? "Not provided"}");

        sb.AppendLine(
            $"Matter Type: " +
            $"{matter.MatterType ?? "Not provided"}");

        sb.AppendLine(
            $"Court: " +
            $"{matter.Court ?? "Not provided"}");

        sb.AppendLine(
            $"Judge: " +
            $"{matter.JudgeName ?? "Not provided"}");

        sb.AppendLine(
            $"Opposite Party: " +
            $"{matter.OppositePartyName ?? "Not provided"}");

        sb.AppendLine(
            $"Client: " +
            $"{matter.Client?.FullName ?? "Not provided"}");

        sb.AppendLine();

        sb.AppendLine(
            "===== SELECTED DOCUMENTS =====");

        if (documents.Count == 0)
        {
            sb.AppendLine(
                "No documents were selected.");

            sb.AppendLine(
                "Do not invent document content.");
        }
        else
        {
            foreach (var document in documents)
            {
                sb.AppendLine();

                sb.AppendLine(
                    $"--- DOCUMENT: {document.Title} ---");

                sb.AppendLine(
                    document.Content ?? "");

                sb.AppendLine(
                    $"--- END DOCUMENT: {document.Title} ---");
            }
        }

        sb.AppendLine();

        sb.AppendLine(
            "===== HEARINGS =====");

        if (hearings.Count == 0)
        {
            sb.AppendLine("None.");
        }
        else
        {
            foreach (var hearing in hearings)
            {
                sb.AppendLine(
                    $"{hearing.HearingDate:dd MMM yyyy}: " +
                    $"{hearing.Stage ?? ""}");
            }
        }

        sb.AppendLine();

        sb.AppendLine(
            "===== TIMELINE =====");

        if (timeline.Count == 0)
        {
            sb.AppendLine("None.");
        }
        else
        {
            foreach (var item in timeline)
            {
                sb.AppendLine(
                    $"{item.EventDate:dd MMM yyyy}: " +
                    $"{item.Title ?? ""}");

                if (!string.IsNullOrWhiteSpace(
                        item.Description))
                {
                    sb.AppendLine(
                        $"Description: {item.Description}");
                }
            }
        }

        sb.AppendLine();

        sb.AppendLine(
            "===== LAWYER REQUEST =====");

        sb.AppendLine(
            lawyerRequest);

        sb.AppendLine();

        sb.AppendLine(
            "Provide a useful legal drafting response.");

        sb.AppendLine(
            "Do not invent facts.");

        return sb.ToString();
    }

    // ============================================================
    // OLLAMA
    // ============================================================

    private async Task<string>
        GenerateAsync(
            string prompt,
            CancellationToken cancellationToken)
    {
        var payload =
            new OllamaGenerateRequest
            {
                Model = _modelName,
                Prompt = prompt,
                Stream = false,

                Options =
                    new OllamaOptions
                    {
                        Temperature = 0.05,
                        NumCtx = 4096,
                        NumPredict = 1200
                    }
            };

        using var request =
            new HttpRequestMessage(
                HttpMethod.Post,
                "api/generate");

        request.Content =
            JsonContent.Create(
                payload,
                options:
                    new JsonSerializerOptions
                    {
                        DefaultIgnoreCondition =
                            JsonIgnoreCondition.WhenWritingNull
                    });

        using var response =
            await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                CancellationToken.None);

        var responseBody =
            await response.Content
                .ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Ollama returned {(int)response.StatusCode}: " +
                responseBody);
        }

        var result =
            JsonSerializer.Deserialize<
                OllamaGenerateResponse>(
                responseBody);

        if (result == null ||
            string.IsNullOrWhiteSpace(
                result.Response))
        {
            throw new InvalidOperationException(
                "Ollama returned an empty response.");
        }

        return result.Response.Trim();
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private static bool
        StartsWithIgnoreCase(
            string value,
            string prefix)
    {
        return value.StartsWith(
            prefix,
            StringComparison.OrdinalIgnoreCase);
    }

    // ============================================================
    // OLLAMA REQUEST
    // ============================================================

    private sealed class OllamaGenerateRequest
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

    // ============================================================
    // OLLAMA OPTIONS
    // ============================================================

    private sealed class OllamaOptions
    {
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        [JsonPropertyName("num_ctx")]
        public int NumCtx { get; set; }

        [JsonPropertyName("num_predict")]
        public int NumPredict { get; set; }
    }

    // ============================================================
    // OLLAMA RESPONSE
    // ============================================================

    private sealed class OllamaGenerateResponse
    {
        [JsonPropertyName("response")]
        public string Response { get; set; } = "";
    }

    // ============================================================
    // CROSS QUESTION CANDIDATE
    // ============================================================

    private sealed class CrossQuestionCandidate
    {
        [JsonPropertyName("source")]
        public string Source { get; set; } = "";

        [JsonPropertyName("question")]
        public string Question { get; set; } = "";
    }
}