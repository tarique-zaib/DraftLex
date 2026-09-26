using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Features.Matters.Create;
using DraftLex.Application.Features.Matters.GetById;
using DraftLex.Application.Features.Timeline.GetByMatter;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

public class UpdateMatterRequest
{
    public string Title { get; set; } = "";
    public string Court { get; set; } = "";
    public string MatterType { get; set; } = "";
    public string Status { get; set; } = "";
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MattersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly LegalDocumentService _documentService;
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MattersController(
        IMediator mediator,
        LegalDocumentService documentService,
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _documentService = documentService;
        _db = db;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateMatterCommand command)
    {
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == id &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var result = await _mediator.Send(new GetMatterByIdQuery(id));

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    // =========================
    // UPDATE MATTER
    // =========================
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateMatterRequest request,
        CancellationToken cancellationToken)
    {
        var matter = await _db.Matters
            .FirstOrDefaultAsync(m =>
                m.Id == id &&
                m.AdvocateId == _currentUser.UserId,
                cancellationToken);

        if (matter == null)
            return NotFound();

        matter.Title = request.Title;
        matter.Court = request.Court;
        matter.MatterType = request.MatterType;
        matter.Status = request.Status;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Matter updated successfully."
        });
    }

    [HttpGet("{id:guid}/timeline")]
    public async Task<IActionResult> GetTimeline(Guid id)
    {
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == id &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var result = await _mediator.Send(new GetTimelineByMatterQuery(id));

        return Ok(result);
    }

    [HttpGet("{matterId:guid}/documents")]
    public async Task<ActionResult<List<DocumentResponse>>> GetDocuments(Guid matterId)
    {
        var ownsMatter = await _db.Matters.AnyAsync(m =>
            m.Id == matterId &&
            m.AdvocateId == _currentUser.UserId);

        if (!ownsMatter)
            return NotFound();

        var documents = await _documentService.GetByMatterAsync(matterId);

        return Ok(documents);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var matters = await _db.Matters
            .Where(m => m.AdvocateId == _currentUser.UserId)
            .Include(m => m.Client)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new
            {
                id = m.Id,
                matterNumber = m.MatterNumber,
                title = m.Title,
                court = m.Court,
                matterType = m.MatterType,
                status = m.Status,
                clientId = m.ClientId,
                client = new
                {
                    fullName = m.Client.FullName
                }
            })
            .ToListAsync(cancellationToken);

        return Ok(matters);
    }

    [HttpGet("recent-activity")]
    public async Task<IActionResult> GetRecentActivity(CancellationToken cancellationToken)
    {
        var activities = await _db.TimelineEvents
            .Where(t => t.Matter.AdvocateId == _currentUser.UserId)
            .Include(t => t.Matter)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new
            {
                t.Id,
                Type = t.EventType,
                t.Title,
                t.Description,
                t.CreatedAt,
                MatterId = t.MatterId,
                MatterTitle = t.Matter.Title
            })
            .ToListAsync(cancellationToken);

        return Ok(activities);
    }
}