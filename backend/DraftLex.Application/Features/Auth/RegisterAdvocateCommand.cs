using MediatR;

namespace DraftLex.Application.Features.Auth;

public record RegisterAdvocateCommand(
    string FullName,
    string BarCouncilNumber,
    string StateBarCouncil,
    string Email,
    string Mobile,
    string Password
) : IRequest<Guid>;