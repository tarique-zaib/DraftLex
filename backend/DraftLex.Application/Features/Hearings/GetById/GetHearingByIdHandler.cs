using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Hearings.GetById;

public class GetHearingByIdHandler
    : IRequestHandler<GetHearingByIdQuery, GetHearingByIdResponse>
{
    private readonly IDraftLexDbContext _db;

    public GetHearingByIdHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<GetHearingByIdResponse> Handle(
        GetHearingByIdQuery request,
        CancellationToken cancellationToken)
    {
        var hearing = await _db.Hearings
            .Include(h => h.Matter)
            .FirstOrDefaultAsync(
                h => h.Id == request.HearingId,
                cancellationToken);

        if (hearing == null)
            throw new KeyNotFoundException("Hearing not found.");

        return new GetHearingByIdResponse
        {
            Id = hearing.Id,
            MatterId = hearing.MatterId,
            MatterTitle = hearing.Matter.Title,
            HearingDate = hearing.HearingDate,
            Stage = hearing.Stage,
            JudgeName = hearing.JudgeName,
            CourtRoom = hearing.CourtRoom,
            Remarks = hearing.Remarks
        };
    }
}