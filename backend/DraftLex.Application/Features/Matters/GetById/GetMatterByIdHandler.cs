using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Application.Features.Matters.GetById;

public class GetMatterByIdHandler
    : IRequestHandler<GetMatterByIdQuery, MatterDetailsResponse?>
{
    private readonly IDraftLexDbContext _db;

    public GetMatterByIdHandler(IDraftLexDbContext db)
    {
        _db = db;
    }

    public async Task<MatterDetailsResponse?> Handle(
        GetMatterByIdQuery request,
        CancellationToken cancellationToken)
    {
        var matter = await _db.Matters
            .Include(x => x.Client)
            .FirstOrDefaultAsync(
                x => x.Id == request.Id,
                cancellationToken);

        if (matter == null)
            return null;

        return new MatterDetailsResponse
        {
            Id = matter.Id,
            MatterNumber = matter.MatterNumber,
            Title = matter.Title,
            MatterType = matter.MatterType,
            Court = matter.Court,
            CaseNumber = matter.CaseNumber,
            JudgeName = matter.JudgeName,
            Status = matter.Status,

            Client = new ClientSummary
            {
                Id = matter.Client.Id,
                ClientCode = matter.Client.ClientCode,
                FullName = matter.Client.FullName,
                Mobile = matter.Client.Mobile
            }
        };
    }
}