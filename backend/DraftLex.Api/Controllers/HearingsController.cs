using DraftLex.Application.Features.Hearings.Create;
using DraftLex.Application.Features.Hearings.GetByMatter;
using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HearingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDraftLexDbContext _db;


    public HearingsController(IMediator mediator, IDraftLexDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHearingCommand command)
    {
        var id = await _mediator.Send(command);

        return Created($"/api/hearings/{id}", new { id });
    }

    [HttpGet("matter/{matterId}")]
    public async Task<IActionResult> GetByMatter(Guid matterId)
    {
        var hearings = await _mediator.Send(new GetHearingsByMatterQuery(matterId));

        return Ok(hearings);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var hearings = await _db.Hearings
            .OrderBy(h => h.HearingDate)
            .Select(h => new
            {
                h.Id,
                h.MatterId,
                h.HearingDate,
                h.Stage,
                h.JudgeName,
                h.CourtRoom
            })
            .ToListAsync(cancellationToken);

        return Ok(hearings);
    }
}