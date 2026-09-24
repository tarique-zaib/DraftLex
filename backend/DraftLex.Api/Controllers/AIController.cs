using DraftLex.Application.Features.AI.GenerateCaseSummary;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly IMediator _mediator;

    public AIController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("case-summary/{matterId:guid}")]
    public async Task<IActionResult> GetCaseSummary(Guid matterId)
    {
        var result = await _mediator.Send(new GenerateCaseSummaryQuery(matterId));

        return Ok(result);
    }
}