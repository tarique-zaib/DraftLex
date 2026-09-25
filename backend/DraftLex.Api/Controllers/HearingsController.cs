using DraftLex.Application.DTOs.Hearings;
using DraftLex.Application.Features.Hearings.Create;
using DraftLex.Application.Features.Hearings.GetByMatter;
using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DraftLex.Application.Features.Hearings.GetById;
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
            .Include(h => h.Matter)
            .ThenInclude(m => m.Client)
            .OrderBy(h => h.HearingDate)
            .Select(h => new
            {
                h.Id,
                h.MatterId,
                MatterTitle = h.Matter.Title,
                Court = h.Matter.Court,
                ClientName = h.Matter.Client.FullName,
                h.HearingDate,
                h.Stage,
                h.JudgeName,
                h.CourtRoom
            })
            .ToListAsync(cancellationToken);

        return Ok(hearings);
    }

    [HttpPut("{id:guid}/reschedule")]
    public async Task<IActionResult> Reschedule(
    Guid id,
    [FromBody] RescheduleHearingRequest request,
    CancellationToken cancellationToken)
    {
        var hearing = await _db.Hearings
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);

        if (hearing == null)
            return NotFound();

        hearing.HearingDate = DateTime.SpecifyKind(
            request.HearingDate,
            DateTimeKind.Utc);

        hearing.Remarks = request.Remarks;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hearing = await _mediator.Send(new GetHearingByIdQuery(id));

        return Ok(hearing);
    }
}