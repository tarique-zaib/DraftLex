using DraftLex.Application.Features.AI.GenerateCaseSummary;
using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.AI.GenerateArguments;

public class GenerateArgumentsHandler
    : IRequestHandler<GenerateArgumentsQuery, GenerateArgumentsResponse>
{
    private readonly IDraftLexDbContext _db;

    public GenerateArgumentsHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<GenerateArgumentsResponse> Handle(
        GenerateArgumentsQuery request,
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
            .FirstOrDefault(h => h.HearingDate >= DateTime.UtcNow);

        var arguments = new List<string>
        {
            $"The present matter is a {matter.MatterType} proceeding before {matter.Court}.",
            $"The client, {matter.Client?.FullName ?? "the client"}, seeks appropriate legal relief.",
            "The facts and available records support the client's position.",
            "Relevant documents placed on record should be relied upon during submissions."
        };

        if (nextHearing != null)
        {
            arguments.Add(
                $"The upcoming hearing is for {nextHearing.Stage}, therefore submissions should focus on that stage.");
        }

        if (documents.Any())
        {
            arguments.Add(
                $"{documents.Count} supporting document(s) are available and should be referenced where appropriate.");
        }

        return new GenerateArgumentsResponse
        {
            Title = $"Arguments for {matter.Title}",
            Introduction =
                $"These arguments are prepared for the upcoming proceedings in {matter.Title}.",
            Arguments = arguments,
            Conclusion =
                "It is respectfully submitted that the available facts and supporting documents justify granting the relief sought.",
            NextHearing = nextHearing?.HearingDate
        };
    }
}