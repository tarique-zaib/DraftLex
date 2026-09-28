using DraftLex.Application.Features.AI.DTOs;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.AI.GetMatterContext;

public class GetMatterContextQueryHandler
    : IRequestHandler<GetMatterContextQuery, MatterContextDto?>
{
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMatterContextQueryHandler(
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MatterContextDto?> Handle(
        GetMatterContextQuery request,
        CancellationToken cancellationToken)
    {
        var matter = await _db.Matters
            .Include(m => m.Client)
            .FirstOrDefaultAsync(m =>
                m.Id == request.MatterId &&
                m.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (matter == null)
            return null;

        var latestHearing = await _db.Hearings
            .Where(h => h.MatterId == matter.Id)
            .OrderByDescending(h => h.HearingDate)
            .FirstOrDefaultAsync(cancellationToken);

        var facts = $"""
Matter Number: {matter.MatterNumber}

Case Title: {matter.Title}

Client: {matter.Client.FullName}

Court: {matter.Court}

Case Number: {matter.CaseNumber}

Judge: {matter.JudgeName}

Opposite Party: {matter.OppositePartyName}

Current Status: {matter.Status}

Current Stage: {latestHearing?.Stage ?? "Not Scheduled"}

Facts Summary:
This matter pertains to {matter.Title} before the {matter.Court}. The client is represented by the advocate, and the matter is presently at the {(latestHearing?.Stage ?? "current")} stage.
""";

        return new MatterContextDto
        {
            MatterId = matter.Id,
            MatterNumber = matter.MatterNumber,
            Title = matter.Title,
            ClientName = matter.Client.FullName,
            Court = matter.Court,
            CaseNumber = matter.CaseNumber,
            JudgeName = matter.JudgeName,
            OppositePartyName = matter.OppositePartyName,
            Status = matter.Status,
            Stage = latestHearing?.Stage ?? "Not Scheduled",
            Facts = facts
        };
    }
}