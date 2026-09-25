using DraftLex.Application.Features.AI.GenerateAffidavit;
using DraftLex.Application.Features.AI.GenerateArguments;
using DraftLex.Application.Features.AI.GenerateCaseSummary;
using DraftLex.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDraftLexDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AIController(
        IMediator mediator,
        IDraftLexDbContext db,
        ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _db = db;
        _currentUser = currentUser;
    }

    private async Task<bool> OwnsMatter(Guid matterId)
    {
        return await _db.Matters.AnyAsync(m =>
            m.Id == matterId &&
            m.AdvocateId == _currentUser.UserId);
    }

    [HttpGet("case-summary/{matterId:guid}")]
    public async Task<IActionResult> GetCaseSummary(Guid matterId)
    {
        if (!await OwnsMatter(matterId))
            return NotFound();

        var result = await _mediator.Send(new GenerateCaseSummaryQuery(matterId));
        return Ok(result);
    }

    [HttpGet("arguments/{matterId:guid}")]
    public async Task<IActionResult> GetArguments(Guid matterId)
    {
        if (!await OwnsMatter(matterId))
            return NotFound();

        var result = await _mediator.Send(new GenerateArgumentsQuery(matterId));
        return Ok(result);
    }

    [HttpGet("affidavit/{matterId:guid}")]
    public async Task<IActionResult> GetAffidavit(Guid matterId)
    {
        if (!await OwnsMatter(matterId))
            return NotFound();

        var result = await _mediator.Send(new GenerateAffidavitQuery(matterId));
        return Ok(result);
    }
}