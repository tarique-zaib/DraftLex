using DraftLex.Application.Features.Matters.Create;
using DraftLex.Application.Features.Matters.GetById;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using DraftLex.Application.Features.Timeline.GetByMatter;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MattersController : ControllerBase
{
    private readonly IMediator _mediator;

    public MattersController(IMediator mediator)
    {
        _mediator = mediator;
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
}