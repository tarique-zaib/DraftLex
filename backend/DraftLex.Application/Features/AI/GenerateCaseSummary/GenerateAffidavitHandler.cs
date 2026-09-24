using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace DraftLex.Application.Features.AI.GenerateAffidavit;

public class GenerateAffidavitHandler
    : IRequestHandler<GenerateAffidavitQuery, GenerateAffidavitResponse>
{
    private readonly IDraftLexDbContext _db;

    public GenerateAffidavitHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<GenerateAffidavitResponse> Handle(
        GenerateAffidavitQuery request,
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

        var body = new StringBuilder();

        body.AppendLine($"I, {matter.Client?.FullName ?? "the Deponent"}, do hereby solemnly affirm and state as under:");
        body.AppendLine();
        body.AppendLine("1. That I am the deponent in the above-mentioned matter and am fully acquainted with the facts of the case.");
        body.AppendLine("2. That the statements made herein are true and correct to the best of my knowledge and belief.");
        body.AppendLine($"3. That this affidavit relates to the matter titled \"{matter.Title}\" pending before {matter.Court}.");
        body.AppendLine("4. That the annexed documents are true copies of the originals.");

        if (hearings.Any())
        {
            var nextHearing = hearings.FirstOrDefault(h => h.HearingDate >= DateTime.UtcNow);

            if (nextHearing != null)
            {
                body.AppendLine($"5. The next hearing is fixed for {nextHearing.HearingDate:dd MMMM yyyy} for {nextHearing.Stage}.");
            }
        }

        if (documents.Any())
        {
            body.AppendLine($"6. {documents.Count} supporting document(s) have been placed on record.");
        }

        body.AppendLine("7. I respectfully pray that this Hon'ble Court may take this affidavit on record.");

        var verification =
$@"VERIFICATION

Verified at {matter.Court} on {DateTime.Now:dd MMMM yyyy} that the contents of this affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed.

Deponent

_____________________";

        return new GenerateAffidavitResponse
        {
            Title = "AFFIDAVIT",
            Court = matter.Court,
            MatterTitle = matter.Title,
            AffiantName = matter.Client?.FullName ?? "Deponent",
            Body = body.ToString(),
            Verification = verification,
            GeneratedOn = DateTime.UtcNow
        };
    }
}