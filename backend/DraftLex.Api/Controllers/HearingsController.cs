using DraftLex.Application.Features.Hearings.Create;
using DraftLex.Application.Features.Hearings.GetByMatter;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HearingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public HearingsController(IMediator mediator)
    {
        _mediator = mediator;
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
}