using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Features.Matters.Create;
using DraftLex.Application.Features.Matters.GetById;
using DraftLex.Application.Features.Timeline.GetByMatter;
using DraftLex.Application.Interfaces;
using DraftLex.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MattersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly LegalDocumentService _documentService;
    private readonly IDraftLexDbContext _db;

    public MattersController(IMediator mediator, LegalDocumentService documentService, IDraftLexDbContext db)
    {
        _mediator = mediator;
        _documentService = documentService;
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateMatterCommand command)
    {
        var id = await _mediator.Send(command);

        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _mediator.Send(new GetMatterByIdQuery(id));

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("{id}/timeline")]
    public async Task<IActionResult> GetTimeline(Guid id)
    {
        var result = await _mediator.Send(new GetTimelineByMatterQuery(id));

        return Ok(result);
    }

    [HttpGet("{matterId:guid}/documents")]
    public async Task<ActionResult<List<DocumentResponse>>> GetDocuments(Guid matterId)
    {
        var documents = await _documentService.GetByMatterAsync(matterId);

        return Ok(documents);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var matters = await _db.Matters
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new
            {
                m.Id,
                m.MatterNumber,
                m.Title,
                m.Status,
                m.Court,
                m.CaseNumber
            })
            .ToListAsync(cancellationToken);

        return Ok(matters);
    }
}