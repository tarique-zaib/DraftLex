using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.AI.GenerateCaseSummary;

public class GenerateCaseSummaryHandler
    : IRequestHandler<GenerateCaseSummaryQuery, GenerateCaseSummaryResponse>
{
    private readonly IDraftLexDbContext _db;

    public GenerateCaseSummaryHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<GenerateCaseSummaryResponse> Handle(
        GenerateCaseSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var matter = await _db.Matters
            .Include(m => m.Client)
            .FirstOrDefaultAsync(
                m => m.Id == request.MatterId,
                cancellationToken);

        if (matter == null)
            throw new KeyNotFoundException("Matter not found.");

        var hearings = await _db.Hearings
            .Where(h => h.MatterId == request.MatterId)
            .OrderBy(h => h.HearingDate)
            .ToListAsync(cancellationToken);

        var documents = await _db.LegalDocuments
            .Where(d => d.MatterId == request.MatterId)
            .ToListAsync(cancellationToken);

        var nextHearing = hearings
            .FirstOrDefault(h => h.HearingDate > DateTime.UtcNow);

        var keyFacts = new List<string>
        {
            $"{matter.MatterType} matter.",
            $"Court: {matter.Court}.",
            $"Client: {matter.Client?.FullName ?? "N/A"}."
        };

        if (nextHearing != null)
            keyFacts.Add(
                $"Next hearing: {nextHearing.HearingDate:dd MMM yyyy}.");

        if (documents.Any())
            keyFacts.Add($"{documents.Count} document(s) available.");

        var riskLevel = matter.Status switch
        {
            "Closed" => "Low",
            "Active" => "Medium",
            _ => "High"
        };

        var nextAction = nextHearing != null
            ? $"Prepare for {nextHearing.Stage}."
            : "Review the matter and schedule the next hearing.";

        return new GenerateCaseSummaryResponse
        {
            Summary =
                $"This is a {matter.MatterType} matter involving {matter.Client?.FullName ?? "the client"} before {matter.Court}.",
            KeyFacts = keyFacts,
            RiskLevel = riskLevel,
            NextAction = nextAction,
            NextHearing = nextHearing?.HearingDate
        };
    }
}