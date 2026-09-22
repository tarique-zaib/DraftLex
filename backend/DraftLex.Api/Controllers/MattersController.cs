using DraftLex.Application.Features.Documents.DTOs;
using DraftLex.Application.Features.Matters.Create;
using DraftLex.Application.Features.Matters.GetById;
using DraftLex.Application.Features.Timeline.GetByMatter;
using DraftLex.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MattersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly LegalDocumentService _documentService;

    public MattersController(IMediator mediator, LegalDocumentService documentService)
    {
        _mediator = mediator;
        _documentService = documentService;
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
}