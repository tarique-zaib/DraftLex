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
        // Ownership should be assigned inside CreateMatterHandler.
        var id = await _mediator.Send(command);

        return CreatedAtAction(nameof(Get), new { id }, new { id });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        // P1 FIX: Verify ownership before returning data.
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
        // P1 FIX: Only return the logged-in advocate's matters.
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
}