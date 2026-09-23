using DraftLex.Application.Features.Copilot;
using DraftLex.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/copilot")]
[Authorize]
public class CopilotController : ControllerBase
{
    private readonly ICopilotService _copilot;

    public CopilotController(ICopilotService copilot)
    {
        _copilot = copilot;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat(
        CopilotChatRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _copilot.ChatAsync(
            request.MatterId,
            request.Message,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("history/{matterId:guid}")]
    public async Task<IActionResult> History(
        Guid matterId,
        CancellationToken cancellationToken)
    {
        var history = await _copilot.GetHistoryAsync(
            matterId,
            cancellationToken);

        return Ok(history);
    }
}