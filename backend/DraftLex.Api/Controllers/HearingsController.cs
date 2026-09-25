using DraftLex.Application.DTOs.Hearings;
using DraftLex.Application.Features.Hearings.Create;
using DraftLex.Application.Features.Hearings.GetByMatter;
using DraftLex.Application.Features.Hearings.GetById;
using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HearingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public HearingsController(
        IMediator mediator,
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _db = db;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHearingCommand command)
    {
        // Ownership is enforced through Matter ownership.
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == command.MatterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var id = await _mediator.Send(command);

        return Created($"/api/hearings/{id}", new { id });
    }

    [HttpGet("matter/{matterId:guid}")]
    public async Task<IActionResult> GetByMatter(Guid matterId)
    {
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == matterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var hearings = await _mediator.Send(new GetHearingsByMatterQuery(matterId));

        return Ok(hearings);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        // P1 FIX: Only current advocate's hearings.
        var hearings = await _db.Hearings
            .Where(h => h.Matter.AdvocateId == _currentUser.UserId)
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
        // P1 FIX: Only owner can reschedule.
        var hearing = await _db.Hearings
            .Include(h => h.Matter)
            .FirstOrDefaultAsync(h =>
                h.Id == id &&
                h.Matter.AdvocateId == _currentUser.UserId,
                cancellationToken);

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
        // P1 FIX: Verify ownership before mediator.
        var ownsHearing = await _db.Hearings.AnyAsync(h =>
            h.Id == id &&
            h.Matter.AdvocateId == _currentUser.UserId);

        if (!ownsHearing)
            return NotFound();

        var hearing = await _mediator.Send(new GetHearingByIdQuery(id));

        if (hearing == null)
            return NotFound();

        return Ok(hearing);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardResponse>> Dashboard()
    {
        var today = DateTime.UtcNow.Date;
        var nextWeek = today.AddDays(7);

        var todayHearings = await _db.Hearings
            .Where(h =>
                h.Matter.AdvocateId == _currentUser.UserId &&
                h.HearingDate.Date == today)
            .Include(h => h.Matter)
                .ThenInclude(m => m.Client)
            .OrderBy(h => h.HearingDate)
            .Select(h => new DashboardHearingDto
            {
                Id = h.Id,
                MatterId = h.MatterId,
                MatterTitle = h.Matter.Title,
                ClientName = h.Matter.Client.FullName,
                Court = h.Matter.Court,
                HearingDate = h.HearingDate,
                Stage = h.Stage
            })
            .ToListAsync();

        var upcoming = await _db.Hearings
            .Where(h =>
                h.Matter.AdvocateId == _currentUser.UserId &&
                h.HearingDate.Date > today &&
                h.HearingDate.Date <= nextWeek)
            .Include(h => h.Matter)
                .ThenInclude(m => m.Client)
            .OrderBy(h => h.HearingDate)
            .Select(h => new DashboardHearingDto
            {
                Id = h.Id,
                MatterId = h.MatterId,
                MatterTitle = h.Matter.Title,
                ClientName = h.Matter.Client.FullName,
                Court = h.Matter.Court,
                HearingDate = h.HearingDate,
                Stage = h.Stage
            })
            .ToListAsync();

        var response = new DashboardResponse
        {
            Today = todayHearings,
            Upcoming = upcoming,
            Stats = new DashboardStatsDto
            {
                Clients = await _db.Clients.CountAsync(c => c.AdvocateId == _currentUser.UserId),
                ActiveMatters = await _db.Matters.CountAsync(m => m.AdvocateId == _currentUser.UserId && m.Status == "Active"),
                Hearings = await _db.Hearings.CountAsync(h => h.Matter.AdvocateId == _currentUser.UserId),
                Documents = await _db.LegalDocuments.CountAsync(d => d.Matter.AdvocateId == _currentUser.UserId)
            }
        };

        return Ok(response);
    }
}