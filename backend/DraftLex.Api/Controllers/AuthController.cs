using DraftLex.Application.Features.Auth.Register;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DraftLex.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterAdvocateCommand command)
    {
        var id = await _mediator.Send(command);

        return CreatedAtAction(nameof(Register), new { id }, new { id });
    }
}