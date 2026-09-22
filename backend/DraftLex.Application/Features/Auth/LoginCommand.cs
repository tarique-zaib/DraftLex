using MediatR;

namespace DraftLex.Application.Features.Auth;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<LoginResponse>;