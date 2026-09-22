using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Hearings.GetByMatter;

public class GetHearingsByMatterHandler
    : IRequestHandler<GetHearingsByMatterQuery, List<HearingResponse>>
{
    private readonly IDraftLexDbContext _db;

    public GetHearingsByMatterHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<List<HearingResponse>> Handle(
        GetHearingsByMatterQuery request,
        CancellationToken cancellationToken)
    {
        return await _db.Hearings
            .Where(h => h.MatterId == request.MatterId && !h.IsCancelled)
            .OrderByDescending(h => h.HearingDate)
            .Select(h => new HearingResponse
            {
                Id = h.Id,
                HearingDate = h.HearingDate,
                CourtRoom = h.CourtRoom,
                JudgeName = h.JudgeName,
                Stage = h.Stage,
                Remarks = h.Remarks,
                NextHearingDate = h.NextHearingDate
            })
            .ToListAsync(cancellationToken);
    }
}